'use strict';
/**
 * Editor helper — 在 VS Code 編輯器中插入文字。
 */

const vscode = require('vscode');

/**
 * 將文字插入到目前編輯器中所有游標/選取的位置。
 * 使用 vscode.TextEditor.edit()，會自動產生 undo 紀錄。
 */
function insertText(text) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return false;

  editor.edit(function(editBuilder) {
    editor.selections.forEach(function(sel) {
      editBuilder.replace(sel, text);
    });
  });

  return true;
}

module.exports = { insertText };
