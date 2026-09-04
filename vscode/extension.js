'use strict';
/**
 * JSZhuyin VS Code Extension — 最簡主入口。
 *
 * 運作方式：註冊內建的 'type' 命令（"Vim 模式"）來攔截鍵盤敲擊。
 * 不需要任何 keybinding（keybinding 宣告只會限制攔截範圍）。
 */

const vscode = require('vscode');
const path = require('path');
const server = require('./src/server');
const view = require('./src/view');
const editor = require('./src/editor');

let enabled = false;

// ---- type command ----

function onType(args) {
  if (!enabled) {
    // Let VS Code handle the key normally
    return vscode.commands.executeCommand('default:type', args);
  }

  const text = args && args.text ? args.text : '';
  if (!text) {
    return vscode.commands.executeCommand('default:type', args);
  }

  const layout = require('./lib/layout-mapper');
  const key = layout.asciiToBopomofo(text) || text;
  const handled = server.handleKey(key);

  if (handled) {
    view.update(server.getState());
    return; // Eat the key — don't call default:type
  }

  view.clear();
  return vscode.commands.executeCommand('default:type', args);
}

// ---- engine callbacks ----

server.onCompositionUpdate = function(symbols) {
  vscode.commands.executeCommand('setContext', 'jszhuyin.composing', !!symbols);
  view.update(server.getState());
};

server.onCandidatesChange = function(candidates) {
  vscode.commands.executeCommand('setContext', 'jszhuyin.composing', !!(candidates && candidates.length));
  view.update(server.getState());
};

server.onCompositionEnd = function(text) {
  vscode.commands.executeCommand('setContext', 'jszhuyin.composing', false);
  view.clear();
  if (text) editor.insertText(text);
};

// ---- toggle ----

function setEnabled(val) {
  enabled = val;
  vscode.commands.executeCommand('setContext', 'jszhuyin.enabled', val);
  if (!val) {
    vscode.commands.executeCommand('setContext', 'jszhuyin.composing', false);
    view.clear();
  }
  view.updateStatusBar(val);
}

function toggle() { setEnabled(!enabled); }

// ---- activate ----

function activate(context) {
  server.init(path.join(context.extensionPath, 'data', 'database.data'));

  context.subscriptions.push(
    vscode.commands.registerCommand('type', onType),
    vscode.commands.registerCommand('jszhuyin.toggle', toggle),
    vscode.commands.registerCommand('jszhuyin.backspace', function() { server.handleKey('Backspace'); }),
    vscode.commands.registerCommand('jszhuyin.confirmCandidate', function() { server.confirmDefault(); }),
    vscode.commands.registerCommand('jszhuyin.cancelComposition', function() {
      server.handleKey('Escape');
      setEnabled(false);
    }),
    vscode.commands.registerCommand('jszhuyin.nextPage', function() { view.nextPage(); }),
    vscode.commands.registerCommand('jszhuyin.prevPage', function() { view.prevPage(); }),
    vscode.commands.registerCommand('jszhuyin.selectCandidate1', function() { server.selectCandidate(0); }),
    vscode.commands.registerCommand('jszhuyin.selectCandidate2', function() { server.selectCandidate(1); }),
    vscode.commands.registerCommand('jszhuyin.selectCandidate3', function() { server.selectCandidate(2); }),
    vscode.commands.registerCommand('jszhuyin.selectCandidate4', function() { server.selectCandidate(3); }),
    vscode.commands.registerCommand('jszhuyin.selectCandidate5', function() { server.selectCandidate(4); }),
    vscode.commands.registerCommand('jszhuyin.selectCandidate6', function() { server.selectCandidate(5); }),
    vscode.commands.registerCommand('jszhuyin.selectCandidate7', function() { server.selectCandidate(6); }),
    vscode.commands.registerCommand('jszhuyin.selectCandidate8', function() { server.selectCandidate(7); }),
    vscode.commands.registerCommand('jszhuyin.selectCandidate9', function() { server.selectCandidate(8); })
  );

  view.init(context);

  vscode.commands.executeCommand('setContext', 'jszhuyin.composing', false);
  vscode.commands.executeCommand('setContext', 'jszhuyin.enabled', false);

  vscode.window.showInformationMessage('JSZhuyin 載入完成。Ctrl+Shift+Z 開關，狀態列按鈕也可切換');
}

function deactivate() { view.dispose(); }

module.exports = { activate, deactivate };
