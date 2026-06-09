export function obterMensagemErroIA(err: any): string {
  let msg = err?.message || 'Erro ao obter resposta.'
  if (err?.status === 503) {
    msg = 'Modelo sobrecarregado (erro 503). Mude para outro modelo no topo do chat (ex: Flash Lite).'
  } else if (err?.status === 429) {
    msg = 'Cota excedida (erro 429). Mude para outro modelo no topo do chat ou aguarde.'
  } else if (err?.status === 400) {
    msg = 'Erro na requisição. Verifique se sua chave nas configurações está correta.'
  }
  return msg
}
