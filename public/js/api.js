export async function loginAdmin(password) {
  const response = await fetch('/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || '登录失败');
  }
  return response.json();
}

export async function listFiles(token, nextPageToken) {
  const url = nextPageToken ? `/admin/files?pageToken=${nextPageToken}` : '/admin/files';
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    throw new Error('无法加载文件列表');
  }
  return response.json();
}

export async function deleteFile(token, fileId) {
  const response = await fetch(`/admin/delete/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('删除失败');
  }
  return true;
}
