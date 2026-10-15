# Power Automate 流程

上传页把表单提交到这条流程。流程用**你的 Microsoft 365 账号**把 Excel 写进 SharePoint，并从你的邮箱发通知。外部人员没有 SharePoint 身份。

页面提交后，访客会离开上传页，看到流程返回的「上传成功」或「上传失败」。

## 先准备好这四项

1. 一个上传口令，只写在流程里，不要写进网页
2. SharePoint 站点地址
3. 每个分类对应的文件夹
4. 接收通知的邮箱（你的邮箱）

网页上的分类编号必须和流程里写的完全一致，多一个空格或大小写不同都不行。当前占位是 `sample-a` 和 `sample-b`，写在 [config.js](config.js)。

## 先把流程建出来

1. 打开 [Power Automate](https://make.powerautomate.com)。
2. 左侧点 **Create**（创建）→ **Automated cloud flow**（自动化云端流）。
3. 跳过流程名字旁边的触发器列表，直接点 **Skip**（跳过）。进到空白画布后再加触发器，比较不容易选错。
4. 点 **Add a trigger**（添加触发器），搜索 `When a HTTP request is received`（当收到 HTTP 请求时），点它。
5. **Who can trigger the flow?**（谁可以触发此流）选 **Anyone**（任何人）。方法保持 **POST**。
6. **Request Body JSON Schema** 那一大块留空，不要填。
7. 点触发器右上角的 **设置**（齿轮或 `...`）。找到 **Asynchronous response**（异步响应），保持关闭。这样访客会等到文件存完、邮件发出，才看到结果页。
8. 点右上角 **Save**（保存）。保存之后，触发器卡片上会出现一长串 **HTTP POST URL**。复制它，贴进 [config.js](config.js) 的 `flowUrl`。

## 整个流程长这样

后面所有步骤都加在上一步的**下面**，不要加到左右分支里，除非某一步明确说「加在如果否里面」。

```text
当收到 HTTP 请求
  → 1. 拆开上传内容（PayloadJson）
  → 2. 口令对不对
        不对 → 显示「上传口令不正确」→ 结束
        对   → 继续往下
  → 3. 是不是 Excel
        不是 → 显示「只接受 Excel 文件」→ 结束
        是   → 继续往下
  → 4. Switch：按分类选文件夹
        sample-a → 文件夹 A
        sample-b → 文件夹 B
        其他     → 显示「分类无效」→ 结束
  → 5. 把文件存进 SharePoint
  → 6. 给你发邮件
  → 7. 显示「上传成功」
```

## 加步骤时先记住三件事

1. 两步之间有一个 **+**。点它，搜索动作的名字，再点搜索结果。
2. 输入框有两种填法：
   - **普通文字**：直接打字，不要点 fx。口令、邮箱、文件夹路径都是这种。
   - **公式**：先点输入框里的 **fx**，把公式粘进去，再点 **Add** / **Update**（添加/更新）。点了 fx 却把口令当公式粘进去，流程会报错。
3. **条件**（Condition）会分出左右两支。左边是 **True / 如果是**，右边是 **False / 如果否**。口令错误、文件不对，都只在右边处理。分类不用条件，第 4 步用 **Switch**。

第 1 步的名字必须叫 `PayloadJson`。后面的公式都靠这个名字来找数据。其他步骤的标题可以改成中文，方便自己看。

### 1. 拆开上传内容

1. 在触发器下面点 **+**。
2. 搜索 **Compose**（撰写）。
3. 点标题 **Compose**，改名为 `PayloadJson`。不要加空格。
4. 点 **Inputs**（输入）框里的 **fx**，粘贴下面这一行，然后点添加：

```
json(decodeUriComponent(replace(replace(base64ToString(triggerBody()?['$content']), 'payload=', ''), '+', '%20')))
```

网页是用表单提交的，Power Automate 不会把内容放进 `payload` 字段，而是放进 `$content`。这一步先把它还原成文字，再拆成口令、文件名、分类和邮箱。不要改回 `triggerBody()?['payload']`，那个值是空的，流程会在这里失败。

### 2. 检查口令

1. 在 `PayloadJson` 下面点 **+**。
2. 搜索 **Condition**（条件），添加它。
3. 点标题，改名为 `口令是否正确`。
4. 条件中间有一行三个空：左边、中间的「等于」、右边。
5. 点**左边**的空，点 **fx**，粘贴：

```
outputs('PayloadJson')?['uploadKey']
```

6. 中间保持 **is equal to**（等于）。
7. 点**右边**的空，**不要点 fx**。直接输入你的口令，例如 `cbd-2026`。

右边现在就是「标准答案」。访客提交的口令和它一模一样，才算通过。

#### 口令不对时

只在右边 **False / 如果否** 里操作。左边先空着。

1. 在「如果否」里面点 **+**。
2. 搜索 **Response**（响应），添加它。
3. **Status Code**（状态代码）填 `403`。
4. 展开 **Headers**（标头），点 **Add new parameter** 或添加一行：
   - 左边键名填 `Content-Type`
   - 右边值填 `text/html; charset=utf-8`
5. **Body**（正文）里粘贴文末的「失败页面」。把 `<p>` 和 `</p>` 中间那句改成：`上传口令不正确`
6. 还是在「如果否」里，Response 下面再点 **+**。
7. 搜索 **Terminate**（终止），添加它。
8. **Status**（状态）选 **Succeeded**（成功）。

终止的作用是叫流程停下来。不加上这一步的话，口令错了它仍会继续去存文件。选「成功」只是表示「这是预料中的拒绝」，不是表示口令正确。

左边「如果是」不要加任何东西。口令正确时，流程会自动走到这个条件的下面，也就是第 3 步。

### 3. 检查是不是 Excel

1. 在整个「口令是否正确」**下面**点 **+**。不要点进左边或右边。
2. 再添加一个 **Condition**，标题改成 `是不是 Excel`。
3. 左边点 **fx**，粘贴：

```
toLower(last(split(outputs('PayloadJson')?['fileName'], '.')))
```

这行的意思是：取文件名最后一个点后面的字，并改成小写。`Report.XLSX` 会变成 `xlsx`。

4. 中间保持 **等于**。
5. 右边不要点 fx，直接输入 `xlsx`。
6. 如果也允许老的 `.xls`：点这行旁边的 **Add**（添加一行）。两行之间的关系从 **And**（并且）改成 **Or**（或者）。第二行左边贴**同一条**公式，右边输入 `xls`。

「如果否」里再做一次和第 2 步相同的两小步：

1. **Response**：状态代码 `403`，标头同样是 `Content-Type` = `text/html; charset=utf-8`，正文用失败页面，那句改成 `只接受 Excel 文件`
2. **Terminate**：状态选 **Succeeded**

### 4. 用 Switch 按分类选文件夹

下拉框的选项是从 [config.js](config.js) 读出来的，所以不用再做一个「分类是否有效」的条件。这里用 **Switch**（切换）：分类是 `sample-a` 就进第一支，是 `sample-b` 就进第二支。

先准备一个空变量，用来记住选中的文件夹：

1. 在「是不是 Excel」下面点 **+**。
2. 搜索 **Initialize variable**（初始化变量）。
3. **Name**（名称）填 `FolderPath`。
4. **Type**（类型）选 **String**（字符串）。
5. **Value**（值）留空。

再加 Switch：

1. 变量下面点 **+**，搜索 **Switch**（切换）。
2. 标题改成 `按分类选文件夹`。
3. **On**（依据）那个框点 **fx**，粘贴后点添加：

```
outputs('PayloadJson')?['category']
```

打开后会看到一个 **Case**（事例）和一个 **Default**（默认）。Case 的值要和 config.js 里的 `id` 一模一样。

**Case：sample-a**

1. Case 的值不要点 fx，输入 `sample-a`。
2. 这个 Case **里面**点 **+**，搜索 **Set variable**（设置变量）。
3. **Name** 选 `FolderPath`。
4. **Value** 不要点 fx，贴分类 A 的文件夹路径，例如：

```
/Shared Documents/External/SampleA
```

**Case：sample-b**

1. 点 **Add case**（添加事例）。
2. 值输入 `sample-b`。
3. 里面同样加一个 **Set variable**，名字还是 `FolderPath`，值改成分类 B 的路径，例如：

```
/Shared Documents/External/SampleB
```

以后网页上多一个分类，就在 config.js 加一条 `id`，再在这里 **Add case**，值填同一个 `id`，里面设置对应文件夹。

路径改成你自己的文件夹。想确认写法：可以先在后面的「创建文件」里用文件夹选择器点一次目标文件夹，看系统显示的路径，抄下来，再回到这里贴上。中文库常常是 `/共享文档/...`，不要猜。

**Default**

下拉框选不出这两个以外的值。Default 只用来拦住绕过网页、直接对流程地址提交的别的分类。

1. 在 **Default** 里面点 **+**，加 **Response**。状态代码 `403`，标头 `Content-Type` = `text/html; charset=utf-8`，正文用失败页面，那句改成 `分类无效`。
2. Response 下面加 **Terminate**，状态选 **Succeeded**。

### 5. 把文件存进 SharePoint

1. 在整个 Switch **下面**点 **+**。不要点进某个 Case 或 Default。
2. 搜索 **Create file**，选 **SharePoint** 下面的那个（创建文件）。不要选 OneDrive。
3. 第一次会要求登录。登录**你自己的工作账号**。以后文件的创建人都会显示成这个账号。
4. **Site Address**（站点地址）选你的 SharePoint 站点。
5. **Folder Path**（文件夹路径）默认是一个文件夹选择器。点进输入框，选 **Enter custom value**（输入自定义值）。然后点闪电路标（动态内容），选择变量 **FolderPath**。不要把路径再手打一遍，否则分类就不起作用了。
6. **File Name**（文件名）点 **fx**，粘贴：

```
concat(utcNow('yyyyMMdd-HHmmss'), '_', replace(replace(replace(outputs('PayloadJson')?['fileName'], '/', ''), decodeUriComponent('%5C'), ''), '..', ''))
```

这会在原始文件名前面加上时间，例如 `20261014-153012_report.xlsx`，避免同名文件被覆盖。

7. **File Content**（文件内容）点 **fx**，粘贴：

```
base64ToBinary(outputs('PayloadJson')?['fileContent'])
```

这一步把网页传来的文字还原成 Excel 文件。你的账号必须对那两个文件夹有编辑权限，否则这里会失败。

这一步的标题先不要改。系统多半会把它叫成 `Create file`。第 6 步的邮件要用这个名字。

### 6. 给你发邮件

1. 在「创建文件」下面点 **+**。
2. 搜索 **Send an email (V2)**，选 **Office 365 Outlook** 下面的那个（发送电子邮件 V2）。
3. 登录还是你的工作账号。邮件会从你的邮箱发出。
4. **To**（收件人）不要点 fx，直接填你的邮箱。
5. **Subject**（主题）点 **fx**，粘贴：

```
concat('新的 Excel 上传 - ', outputs('PayloadJson')?['category'], ' - ', outputs('PayloadJson')?['fileName'])
```

6. **Body**（正文）不要点 fx。直接把下面这段粘进正文框。`@{ }` 是插入前面步骤的结果，系统会自动换成真实内容：

```
上传人：@{outputs('PayloadJson')?['uploaderEmail']}
分类：@{outputs('PayloadJson')?['category']}
文件：@{outputs('Create_file')?['body/Name']}
路径：@{outputs('Create_file')?['body/Path']}
时间：@{utcNow()}
```

如果保存时提示找不到 `Create_file`：打开第 5 步的卡片，看标题到底叫什么。把上面两处 `Create_file` 换成那个标题，空格改成下划线。例如标题是 `Create file 1`，就写成 `Create_file_1`。

### 7. 告诉访客上传成功

1. 在发邮件下面点 **+**。
2. 再添加一个 **Response**（响应）。
3. **Status Code** 填 `200`。
4. 标头同样加一行：`Content-Type` = `text/html; charset=utf-8`。
5. 正文粘贴下面的「成功页面」。

这一步要放在存文件和发邮件**之后**。访客看到「上传成功」时，文件和邮件都已经完成。

如果存文件或发邮件本身失败，访客会看到 Power Automate 自己的错误页，不会看到「上传成功」。

最后再点一次 **Save**。

## 成功页面

粘贴到第 7 步的正文：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>上传成功</title></head>
<body>
  <h1>上传成功</h1>
  <p>文件已收到，接收方会收到邮件通知。</p>
</body>
</html>
```

## 失败页面

第 2 步、第 3 步的「如果否」，以及第 4 步 Switch 的 Default 里，各粘贴一次。只有 `<p>` 中间那句不同：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>上传失败</title></head>
<body>
  <h1>上传失败</h1>
  <p>上传口令不正确</p>
</body>
</html>
```

- 第 2 步：`上传口令不正确`
- 第 3 步：`只接受 Excel 文件`
- 第 4 步 Default：`分类无效`

## 发布上传页

1. 把这个目录推到 GitHub 仓库。
2. 仓库 **Settings → Pages**。Branch 选 `main`，文件夹选 `/ (root)`。
3. 公开地址类似 `https://<user>.github.io/<repo>/`。
4. `config.js` 里的 `flowUrl` 填好后再推一次。这个地址会出现在网页源码里。口令不在源码里，只拿到地址还不能通过第 2 步。

## 自测

1. 用无痕窗口打开 GitHub Pages 地址，确认不用登录就能看到表单。
2. 上传一个小于 20MB 的 `.xlsx`，选示例分类 A，填写邮箱和正确口令。
3. 浏览器应停在「上传成功」。
4. SharePoint 分类 A 的文件夹里有带时间戳的文件，修改人是你的账号。
5. 你的邮箱收到通知，正文里的上传人是刚才填写的邮箱。
6. 用错误口令再传一次，应停在「上传失败」，SharePoint 里不新增文件。

## 卡住时看哪里

如果浏览器上是这段英文：

```json
{"error":{"code":"NoResponse","message":"The server did not receive a response from an upstream server..."}}
```

这不是 SharePoint 的报错。意思是：流程没有把「上传成功」或「上传失败」那一页返回给浏览器。真正的原因在流程的运行记录里。

1. 打开 [Power Automate](https://make.powerautomate.com)，进入这条流程。
2. 点上面的 **Run history**（运行历史）。看刚才那个时间点有没有一次运行。
3. 有运行：点进去，找红色的那一步。那一步的报错才是原因。
4. 没有运行：网页里的 `flowUrl` 不是这条流程的 HTTP POST URL，或者流程没保存。

浏览器出现 `NoResponse`，通常是结果页那一步没跑到。对照红色步骤：

- 红在 `PayloadJson`，并提示 `json` 收到的是 `Null`：第 1 步还在用 `triggerBody()?['payload']`。换成上面的 `$content` 那条公式，保存后再试。
- 红在「创建文件」：文件夹路径不对，或你的账号没有那个文件夹的编辑权限。文件不会出现在 SharePoint 里。
- 红在「发送电子邮件」：Outlook 没登录，或收件人地址不对。文件可能已经在 SharePoint 里了。
- 运行记录是成功，但浏览器仍是 `NoResponse`：成功页的 Response 不在流程主干上，而是放进了某个 Case 里面。把它挪到发邮件下面。

正常拆开后，里面是这些项：

```json
{
  "fileName": "report.xlsx",
  "fileContent": "<文件内容，不是人能读的长串>",
  "category": "sample-a",
  "uploaderEmail": "person@example.com",
  "uploadKey": "<访客输入的口令>"
}
```

## 限制

- 原始文件上限 20MB。
- 网页上的检查只是提前提示。真正决定能不能存进去的，是流程里的口令、文件类型，以及 Switch 里写死的文件夹。
- 你的 SharePoint 或 Outlook 登录过期后，上传会失败，需要回到第 5 步或第 6 步重新登录。
