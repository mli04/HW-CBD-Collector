// Values in this file are public once the site is on GitHub Pages.
// Do not put the upload passphrase here. It lives only in the Power Automate flow.
window.UPLOAD_CONFIG = {
  // Paste the "When a HTTP request is received" POST URL after you save the flow.
  flowUrl: "https://default74da624fe27a4b038702f5e0a389e0.09.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/29/workflows/bb1f732a7b7842a5a86c63577a2acf2b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=78BmdFgSWSnfpDiTyJhtvMw7TyA36WPvzqpWeVKtYnk",

  // Original file size limit. Base64 makes the request body about one third larger.
  maxFileBytes: 20 * 1024 * 1024,

  // id is sent to the flow and must match the flow's category Switch exactly.
  // label is what the visitor sees.
  categories: [
    { id: "sample-a", label: "示例分类 A" },
    { id: "sample-b", label: "示例分类 B" },
  ],
};
