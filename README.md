# Excel 上传 POC

外部人员打开页面，提交 Excel、分类、邮箱和上传口令。页面托管在 GitHub Pages。Power Automate 用你的 Microsoft 365 账号把文件写入对应的 SharePoint 文件夹，并给您发邮件。

## 使用前

1. 按 [POWER-AUTOMATE.md](POWER-AUTOMATE.md) 建好流程。
2. 把流程的 HTTP POST URL 填进 [config.js](config.js) 的 `flowUrl`。
3. 让 `config.js` 里的分类 `id` 和流程里的 Switch 一致。
4. 仓库 Settings → Pages → 从 `main` 分支的根目录发布。

上传口令只放在流程里，不要写进 `config.js`。`flowUrl` 会随网页公开。
