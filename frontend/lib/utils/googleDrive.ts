export async function obterBlobGoogleDrive(
  driveFileId: string,
  googleToken: string
): Promise<Blob> {
  const url = `https://www.googleapis.com/drive/v3/files/${driveFileId}?alt=media`
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${googleToken}`
    }
  })

  if (!response.ok) {
    throw new Error('Falha ao obter os dados do arquivo do Google Drive')
  }

  return response.blob()
}
