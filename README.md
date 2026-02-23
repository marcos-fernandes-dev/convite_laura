# RSVP Frontend (GitHub Pages) + Apps Script API

## Estrutura

- `index.html`: tela do formulario
- `styles.css`: estilos mobile-first
- `app.js`: logica do formulario e envio para API
- `Codigo.gs`: backend no Google Apps Script

## 1) Publicar o backend (Apps Script)

1. Abra o projeto no Apps Script.
2. Substitua o conteudo do arquivo `.gs` pelo arquivo `Codigo.gs` deste repositorio.
3. Clique em `Deploy` -> `New deployment` -> tipo `Web app`.
4. Configure:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone`
5. Publique e copie a URL que termina em `/exec`.

## 2) Configurar o frontend

1. Em `app.js`, altere:
   - `CONFIG.apiUrl = "COLE_AQUI_URL_DO_WEB_APP"`
2. Mantenha `apiTransport: "jsonp"` para GitHub Pages.

## 3) Publicar no GitHub Pages

1. Suba os arquivos para um repositorio GitHub.
2. Em `Settings` -> `Pages`:
   - Source: `Deploy from a branch`
   - Branch: `main` (root)
3. Abra a URL publicada do GitHub Pages.

## 4) Teste rapido

- Abra a pagina publicada.
- Preencha o formulario e envie.
- Verifique se as linhas foram gravadas na planilha vinculada ao Apps Script.

## Observacoes

- O transporte `jsonp` foi escolhido para evitar problemas de CORS no browser com Apps Script.
- Se quiser usar `POST`, troque `apiTransport` para `"post"` e valide CORS no seu ambiente.
