document.addEventListener('DOMContentLoaded', function() {
    // DOM要素の取得
    const searchButton = document.getElementById('search-button');
    const searchQuery = document.getElementById('search-query');
    const maxIterations = document.getElementById('max-iterations');
    const reportStyle = document.getElementById('report-style');
    const searchStatus = document.getElementById('search-status');
    const spinner = document.getElementById('spinner');
    const logsContent = document.getElementById('logs-content');
    const reportContent = document.getElementById('report-content');
    const resultLength = document.getElementById('result-length');
    const closeSidebarButton = document.querySelector('.close-sidebar');
    const rightSidebar = document.querySelector('.right-sidebar');
    const sidebarMenuItems = document.querySelectorAll('.sidebar-menu li');

    // 現在の検索ID
    let currentSearchId = null;
    // ポーリングタイマー
    let statusTimer = null;

    // サイドバーメニューのアクティブ状態切り替え
    sidebarMenuItems.forEach(item => {
        item.addEventListener('click', function() {
            sidebarMenuItems.forEach(menuItem => menuItem.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 右サイドバーを閉じるボタン
    if (closeSidebarButton) {
        closeSidebarButton.addEventListener('click', function() {
            rightSidebar.style.display = 'none';
        });
    }

    // 検索ボタンのクリックイベント
    searchButton.addEventListener('click', function() {
        const query = searchQuery.value.trim();
        
        if (!query) {
            alert('検索クエリを入力してください');
            return;
        }
        
        // 検索開始
        startSearch(query, maxIterations.value, reportStyle.value);
        
        // 右サイドバーを表示
        if (rightSidebar) {
            rightSidebar.style.display = 'flex';
        }
    });

    // Enterキーでも検索開始
    searchQuery.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });

    // 検索を開始する関数
    function startSearch(query, maxIterations, style) {
        // UI状態の更新
        searchButton.disabled = true;
        searchStatus.textContent = '検索を開始しています...';
        spinner.style.display = 'block';
        logsContent.textContent = '';
        reportContent.innerHTML = '';
        resultLength.textContent = '最終結果の長さ: 0 文字';
        
        // ウェルカムメッセージを非表示
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
        
        // 既存のポーリングを停止
        if (statusTimer) {
            clearInterval(statusTimer);
        }
        
        // 検索リクエストを送信
        fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                max_iterations: parseInt(maxIterations),
                style: style
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
                return;
            }
            
            currentSearchId = data.search_id;
            
            // ステータスのポーリングを開始
            statusTimer = setInterval(() => {
                checkStatus(currentSearchId);
            }, 1000);
        })
        .catch(error => {
            showError('リクエストの送信中にエラーが発生しました: ' + error);
        });
    }

    // 検索ステータスを確認する関数
    function checkStatus(searchId) {
        fetch(`/status/${searchId}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'not_found') {
                    showError('検索IDが見つかりません');
                    stopPolling();
                    return;
                }
                
                // ログの更新
                if (data.logs) {
                    // ログをステップごとに分割して表示
                    const formattedLogs = formatLogs(data.logs);
                    logsContent.innerHTML = formattedLogs;
                    logsContent.scrollTop = logsContent.scrollHeight;
                }
                
                // ステータスの更新
                updateStatus(data.status);
                
                // 検索が完了した場合
                if (data.status === 'completed' || data.status === 'error') {
                    if (data.result) {
                        // マークダウンをHTMLに変換して表示
                        const resultHtml = marked.parse(data.result);
                        
                        // レポートをチャットメッセージとして表示
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'ai-message';
                        messageDiv.innerHTML = resultHtml;
                        reportContent.innerHTML = '';
                        reportContent.appendChild(messageDiv);
                        
                        // 結果の文字数を計算して表示
                        const plainText = data.result.replace(/\n/g, '').replace(/\r/g, '');
                        const charCount = plainText.length;
                        resultLength.textContent = `最終結果の長さ: ${charCount} 文字`;
                        
                        // 全履歴が見えるようにサイドバーの高さを調整
                        const rightSidebar = document.querySelector('.right-sidebar');
                        const sidebarContent = document.querySelector('.sidebar-content');
                        const logContainer = document.querySelector('.log-container');
                        if (rightSidebar && sidebarContent) {
                            // サイドバーの高さを自動調整
                            rightSidebar.style.maxHeight = 'none';
                            sidebarContent.style.maxHeight = 'none';
                            if (logContainer) logContainer.style.maxHeight = 'none';
                            logsContent.style.maxHeight = 'none';
                            
                            // スクロール位置を一番上に移動
                            setTimeout(() => {
                                if (logContainer) logContainer.scrollTop = 0;
                                else logsContent.scrollTop = 0;
                            }, 100);
                            
                            // 完了メッセージを追加
                            const completeMessage = document.createElement('div');
                            completeMessage.className = 'search-complete';
                            completeMessage.innerHTML = '<i class="fas fa-check-circle"></i> 検索完了';
                            logsContent.appendChild(completeMessage);
                        }
                    }
                    stopPolling();
                }
            })
            .catch(error => {
                showError('ステータスの確認中にエラーが発生しました: ' + error);
                stopPolling();
            });
    }

    // ステータスを更新する関数
    function updateStatus(status) {
        switch (status) {
            case 'running':
                searchStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 検索実行中...';
                break;
            case 'completed':
                searchStatus.innerHTML = '<i class="fas fa-check-circle"></i> 検索完了';
                break;
            case 'error':
                searchStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> エラーが発生しました';
                break;
            default:
                searchStatus.textContent = status;
        }
    }

    // ポーリングを停止する関数
    function stopPolling() {
        if (statusTimer) {
            clearInterval(statusTimer);
            statusTimer = null;
        }
        
        searchButton.disabled = false;
        spinner.style.display = 'none';
        
        // レポートが表示されたらスクロールを一番下に
        reportContent.scrollTop = reportContent.scrollHeight;
    }

    // エラーを表示する関数
    function showError(message) {
        searchStatus.textContent = 'エラー';
        logsContent.textContent += '\n\nエラー: ' + message;
        stopPolling();
    }
    
    // ログをフォーマットする関数
    function formatLogs(logs) {
        // 反復（イテレーション）を検出して強調表示
        logs = logs.replace(/\[反復 (\d+)\]/g, '<div class="iteration-marker"><i class="fas fa-sync-alt"></i> 反復 $1</div>');
        
        // ステップ5を特別にフォーマット
        logs = logs.replace(/\[ステップ5\] (.+?)(?=\[ステップ|$)/gs, function(match, content) {
            // クエリを抽出
            const queryMatch = content.match(/"(.+?)"/);
            const query = queryMatch ? queryMatch[1] : '';
            
            // URLを抽出
            const urlMatch = content.match(/検索されたURL: (.+?)(?=\n|$)/);
            const url = urlMatch ? urlMatch[1] : '';
            
            // 結果の長さを抽出
            const resultMatch = content.match(/検索結果の長さ: (\d+) 文字/);
            const resultLength = resultMatch ? resultMatch[1] : '';
            
            let formattedContent = '<div class="log-step step5">';
            formattedContent += '<div class="step-header"><i class="fas fa-search"></i> ステップ5: 次のサブクエリで検索を実行</div>';
            formattedContent += '<div class="step5-content">';
            
            // クエリ表示
            if (query) {
                formattedContent += `<div class="query-box"><div class="query-text">${query}</div></div>`;
            }
            
            // URL表示
            if (url) {
                formattedContent += `<div class="url-info"><i class="fas fa-link"></i> 検索されたURL: <a href="${url}" target="_blank">${url}</a></div>`;
            }
            
            // 結果の長さ表示
            if (resultLength) {
                formattedContent += `<div class="result-info"><i class="fas fa-file-alt"></i> 検索結果の長さ: ${resultLength} 文字</div>`;
            }
            
            formattedContent += '</div></div>';
            return formattedContent;
        });
        
        // 他のステップを検出して分割
        logs = logs.replace(/\[ステップ([1-4]|[6-9]\d*)\] (.+?)(?=\[ステップ|$)/gs, '<div class="log-step"><div class="step-header">ステップ$1: $2</div></div>');
        
        // サブクエリを検出して強調表示
        logs = logs.replace(/サブクエリ(\d+): "(.+?)"/g, '<div class="subquery"><i class="fas fa-search"></i> サブクエリ$1: "$2"</div>');
        
        // 検索結果を検出して強調表示
        logs = logs.replace(/検索結果の長さ: (\d+) 文字/g, '<div class="result-info"><i class="fas fa-file-alt"></i> 検索結果の長さ: $1 文字</div>');
        
        // ステップ5以外のURLを検出して強調表示
        logs = logs.replace(/検索されたURL: (.+?)(?=<\/div>|\n|$)/g, function(match, url) {
            // 既にステップ5の中にあるURLは置換しない
            if (match.indexOf('step5-content') !== -1) return match;
            return `<div class="url-info"><i class="fas fa-link"></i> 検索されたURL: <a href="${url}" target="_blank">${url}</a></div>`;
        });
        
        // エラーメッセージを検出して強調表示
        logs = logs.replace(/エラー: (.+)/g, '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> エラー: $1</div>');
        
        // ステップの完了を検出して強調表示
        logs = logs.replace(/(ステップ\d+完了)/g, '<div class="step-complete"><i class="fas fa-check-circle"></i> $1</div>');
        
        return logs;
    }

    // URLからクエリパラメータを取得して自動検索
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('query');
    if (queryParam) {
        searchQuery.value = queryParam;
        const iterParam = urlParams.get('iterations');
        if (iterParam && maxIterations.querySelector(`option[value="${iterParam}"]`)) {
            maxIterations.value = iterParam;
        }
        const styleParam = urlParams.get('style');
        if (styleParam && reportStyle.querySelector(`option[value="${styleParam}"]`)) {
            reportStyle.value = styleParam;
        }
        
        // 少し遅延させて自動検索
        setTimeout(() => {
            searchButton.click();
        }, 500);
    }
});
