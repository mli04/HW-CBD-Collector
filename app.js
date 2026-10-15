(function () {
  var config = window.UPLOAD_CONFIG || {};
  var form = document.getElementById("upload-form");
  var fileInput = document.getElementById("file");
  var fileMeta = document.getElementById("file-meta");
  var categorySelect = document.getElementById("category");
  var emailInput = document.getElementById("email");
  var uploadKeyInput = document.getElementById("upload-key");
  var statusNode = document.getElementById("status");
  var submitButton = document.getElementById("submit");

  var categories = Array.isArray(config.categories) ? config.categories : [];
  categories.forEach(function (category) {
    var option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.label;
    categorySelect.appendChild(option);
  });

  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    fileMeta.textContent = file ? file.name + " · " + formatSize(file.size) : "";
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    submit().catch(function () {
      setBusy(false);
      setStatus("读取文件失败，请重试。");
    });
  });

  function submit() {
    setStatus("");
    var file = fileInput.files && fileInput.files[0];
    var category = categorySelect.value;
    var email = emailInput.value.trim();
    var uploadKey = uploadKeyInput.value;
    var error = validate(file, category, email, uploadKey);
    if (error) {
      setStatus(error);
      return Promise.resolve();
    }

    setBusy(true);
    setStatus("正在提交，请稍候…");
    return readFileAsBase64(file).then(function (fileContent) {
      postToFlow({
        fileName: file.name,
        fileContent: fileContent,
        category: category,
        uploaderEmail: email,
        uploadKey: uploadKey,
      });
    });
  }

  function validate(file, category, email, uploadKey) {
    if (!categories.length) {
      return "还没有可用的分类。";
    }
    if (!file) {
      return "请选择 Excel 文件。";
    }
    var extension = file.name.split(".").pop().toLowerCase();
    if (extension !== "xlsx" && extension !== "xls") {
      return "只接受 .xlsx 或 .xls 文件。";
    }
    if (file.size > (config.maxFileBytes || 20 * 1024 * 1024)) {
      return "文件超过 20MB，请缩小后再上传。";
    }
    if (!category || !categories.some(function (item) { return item.id === category; })) {
      return "请选择分类。";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "请输入有效邮箱。";
    }
    if (!uploadKey.trim()) {
      return "请输入上传口令。";
    }
    if (!config.flowUrl) {
      return "流程地址还没有配置。请在 config.js 填入 Power Automate 的 HTTP 地址。";
    }
    return "";
  }

  function postToFlow(payload) {
    var transport = document.createElement("form");
    var field = document.createElement("textarea");
    transport.method = "POST";
    transport.action = config.flowUrl;
    transport.acceptCharset = "UTF-8";
    transport.hidden = true;
    field.name = "payload";
    field.value = JSON.stringify(payload);
    transport.appendChild(field);
    document.body.appendChild(transport);
    transport.submit();
  }

  function readFileAsBase64(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var result = String(reader.result || "");
        var comma = result.indexOf(",");
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      };
      reader.onerror = function () {
        reject(reader.error || new Error("read failed"));
      };
      reader.readAsDataURL(file);
    });
  }

  function setBusy(busy) {
    submitButton.disabled = busy;
  }

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }
})();
