export class GoogleDriveAPI {
  constructor(serviceAccountEmail, privateKey) {
    this.serviceAccountEmail = serviceAccountEmail;
    this.privateKey = privateKey;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const jwtHeader = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: this.serviceAccountEmail,
      sub: this.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const jwt = await this.createJWT(jwtHeader, jwtPayload);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token request failed:', response.status, errorText);
      throw new Error(`Token request failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.access_token) {
      console.error('No access token in response:', data);
      throw new Error('No access token received');
    }
    
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
    
    return this.accessToken;
  }

  async createJWT(header, payload) {
    const encodedHeader = btoa(JSON.stringify(header)).replace(/[+/=]/g, (m) => ({ '+': '-', '/': '_', '=': '' }[m]));
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/[+/=]/g, (m) => ({ '+': '-', '/': '_', '=': '' }[m]));
    
    const data = `${encodedHeader}.${encodedPayload}`;
    
    try {
      // 处理私钥格式 - 支持 JSON 转义和普通格式
      let privateKeyPem = this.privateKey;
      
      // 如果包含转义的换行符，先处理
      if (privateKeyPem.includes('\\n')) {
        privateKeyPem = privateKeyPem.replace(/\\n/g, '\n');
      }
      
      // 确保私钥格式正确
      privateKeyPem = privateKeyPem.trim();
      
      // 验证私钥格式
      if (!privateKeyPem.includes('-----BEGIN PRIVATE KEY-----') || 
          !privateKeyPem.includes('-----END PRIVATE KEY-----')) {
        console.error('Private key validation failed. Key preview:', privateKeyPem.substring(0, 100));
        throw new Error('Invalid private key format');
      }
      
      const key = await crypto.subtle.importKey(
        'pkcs8',
        this.pemToArrayBuffer(privateKeyPem),
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        key,
        new TextEncoder().encode(data)
      );

      const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/[+/=]/g, (m) => ({ '+': '-', '/': '_', '=': '' }[m]));

      return `${data}.${encodedSignature}`;
    } catch (error) {
      console.error('JWT creation error:', error);
      throw new Error(`JWT creation failed: ${error.message}`);
    }
  }

  pemToArrayBuffer(pem) {
    // 提取PEM格式中的base64内容
    let b64 = pem
      .replace(/-----BEGIN PRIVATE KEY-----/g, '')
      .replace(/-----END PRIVATE KEY-----/g, '')
      .replace(/\s/g, ''); // 移除所有空白字符
    
    // 确保base64字符串的长度是4的倍数
    while (b64.length % 4) {
      b64 += '=';
    }
    
    try {
      const binary = atob(b64);
      const buffer = new ArrayBuffer(binary.length);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < binary.length; i++) {
        view[i] = binary.charCodeAt(i);
      }
      return buffer;
    } catch (error) {
      console.error('Base64 decode error:', error, 'Input:', b64.substring(0, 50) + '...');
      throw new Error('Invalid private key format');
    }
  }

  async uploadFile(fileName, fileContent, folderId) {
    const accessToken = await this.getAccessToken();
    
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent]));

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // 启动 resumable upload 会话
  async startResumableUpload(fileName, fileSize, folderId) {
    const accessToken = await this.getAccessToken();
    
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': fileSize.toString(),
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to start resumable upload: ${response.statusText} - ${errorText}`);
    }

    return response.headers.get('Location');
  }

  // 上传文件块
  async uploadChunk(uploadUrl, chunk, start, totalSize) {
    const end = start + chunk.byteLength - 1;
    
    console.log('🔗 Google Drive uploadChunk:', {
      range: `${start}-${end}/${totalSize}`,
      chunkSize: chunk.byteLength,
      uploadUrl: uploadUrl.substring(0, 50) + '...'
    });
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Content-Length': chunk.byteLength.toString(),
      },
      body: chunk,
    });

    console.log('📡 Google Drive response:', {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': response.headers.get('Content-Type'),
        'range': response.headers.get('Range'),
        'retry-after': response.headers.get('Retry-After'),
        'x-goog-quota-error': response.headers.get('X-Goog-Quota-Error')
      }
    });

    if (response.status === 200 || response.status === 201) {
      // 上传完成
      const result = await response.json();
      console.log('✅ Upload completed:', result);
      return { completed: true, result };
    } else if (response.status === 308) {
      // 需要继续上传
      const range = response.headers.get('Range');
      const nextStart = range ? parseInt(range.split('-')[1]) + 1 : start + chunk.byteLength;
      console.log('📄 Continue upload:', { range, nextStart });
      return { completed: false, nextStart };
    } else {
      const errorText = await response.text();
      console.error('❌ Google Drive upload error:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        range: `${start}-${end}`,
        chunkSize: chunk.byteLength,
        uploadUrl: uploadUrl.substring(0, 50) + '...'
      });
      throw new Error(`Chunk upload failed: HTTP ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  // 检查上传状态
  async checkUploadStatus(uploadUrl, totalSize) {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes */${totalSize}`,
      },
    });

    if (response.status === 200 || response.status === 201) {
      return { completed: true, result: await response.json() };
    } else if (response.status === 308) {
      const range = response.headers.get('Range');
      const bytesUploaded = range ? parseInt(range.split('-')[1]) + 1 : 0;
      return { completed: false, bytesUploaded };
    } else {
      const errorText = await response.text();
      throw new Error(`Status check failed: ${response.statusText} - ${errorText}`);
    }
  }

  async downloadFile(fileId) {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response;
  }

  async downloadFileRange(fileId, start, end) {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Range': `bytes=${start}-${end}`,
      },
    });

    return response;
  }

  async getFileInfo(fileId) {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,size,mimeType,createdTime`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get file info: ${response.statusText}`);
    }

    return response.json();
  }

  async listFiles(folderId, pageSize = 50, pageToken = null) {
    const accessToken = await this.getAccessToken();
    
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'nextPageToken,files(id,name,size,mimeType,createdTime)',
      pageSize: pageSize.toString(),
      orderBy: 'createdTime desc'
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`);
    }

    return response.json();
  }

  async deleteFile(fileId) {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  }
}