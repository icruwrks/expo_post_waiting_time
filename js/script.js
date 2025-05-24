// パビリオンのデータ
const pavilions = {
    domestic: [
        { value: "japan", label: "日本館" },
        { value: "sumitomo", label: "住友館" },
    ],
    foreign: [
        { value: "usa", label: "アメリカ" },
        { value: "italy", label: "イタリア" },
        { value: "turkmenistan", label: "トルクメニスタン" },
        { value: "azerbaijan", label: "アゼルバイジャン" },
    ],
    signature: [
        { value: "better_co_being", label: "Better Co-Being 宮田 裕章" },
        { value: "null2", label: "null²(ヌルヌル) 落合 陽一" },
    ]
};

// Discordウェブフックの設定（実際のURLに置き換える必要があります）
const DISCORD_WEBHOOK_URL = "YOUR_DISCORD_WEBHOOK_URL_HERE";

// DOMの読み込み完了時に実行
document.addEventListener('DOMContentLoaded', () => {    // 要素の取得
    const categorySelect = document.getElementById('category');
    const pavilionSelect = document.getElementById('pavilion');
    const hoursSelect = document.getElementById('hours');
    const minutesSelect = document.getElementById('minutes');
    const statusSelect = document.getElementById('status');
    const form = document.getElementById('waiting-time-form');
    const resultDiv = document.getElementById('result');
    const resultMessage = document.getElementById('result-message');
    const newPostButton = document.getElementById('new-post-button');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationMessage = document.getElementById('confirmation-message');
    const cancelButton = document.getElementById('cancel-button');
    const confirmButton = document.getElementById('confirm-button');

    // カテゴリが変更されたときの処理
    categorySelect.addEventListener('change', () => {
        const selectedCategory = categorySelect.value;
        
        // パビリオンのリストをクリア
        pavilionSelect.innerHTML = '';
        
        // デフォルトの選択肢を追加
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.textContent = 'パビリオンを選択してください';
        pavilionSelect.appendChild(defaultOption);
        
        // 選択されたカテゴリに応じたパビリオンのリストを追加
        if (selectedCategory in pavilions) {
            pavilions[selectedCategory].forEach(pavilion => {
                const option = document.createElement('option');
                option.value = pavilion.value;
                option.textContent = pavilion.label;
                pavilionSelect.appendChild(option);
            });
            
            // パビリオンの選択を有効化
            pavilionSelect.disabled = false;
        }
    });

    // 待ち時間と状態の相互排他制御
    const timeSelectors = document.querySelectorAll('#hours, #minutes');
    
    timeSelectors.forEach(selector => {
        selector.addEventListener('change', () => {
            if (hoursSelect.value !== '0' || minutesSelect.value !== '0') {
                statusSelect.selectedIndex = 0;
            }
        });
    });
    
    statusSelect.addEventListener('change', () => {
        if (statusSelect.value) {
            hoursSelect.selectedIndex = 0;
            minutesSelect.selectedIndex = 0;
        }
    });    // フォームの送信処理
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 入力値の取得
        const category = categorySelect.options[categorySelect.selectedIndex].text;
        const pavilion = pavilionSelect.options[pavilionSelect.selectedIndex].text;
        
        let waitingTimeText;
        if (statusSelect.value) {
            // 状態が選択されている場合
            waitingTimeText = statusSelect.options[statusSelect.selectedIndex].text;
        } else {
            // 時間が選択されている場合
            const hours = parseInt(hoursSelect.value);
            const minutes = parseInt(minutesSelect.value);
            
            if (hours === 0 && minutes === 0) {
                waitingTimeText = "待ちなし";
            } else {
                if (hours > 0) {
                    waitingTimeText = `${hours}時間`;
                    if (minutes > 0) {
                        waitingTimeText += `${minutes}分`;
                    }
                } else {
                    waitingTimeText = `${minutes}分`;
                }
            }
        }
        
        // 投稿メッセージの作成
        const message = `${pavilion} ${waitingTimeText}`;
        
        // 確認ダイアログを表示
        confirmationMessage.textContent = message;
        confirmationModal.classList.remove('hidden');
    });
    
    // 確認ボタンの処理
    confirmButton.addEventListener('click', async () => {
        const message = confirmationMessage.textContent;
        
        // 確認ダイアログを閉じる
        confirmationModal.classList.add('hidden');
        
        // Discordへの投稿
        try {
            await sendToDiscord(message);
            
            // 結果の表示
            resultMessage.textContent = message;
            form.classList.add('hidden');
            resultDiv.classList.remove('hidden');
            
            showNotification("Discordに投稿しました！", false);
        } catch (error) {
            console.error("Discord投稿エラー:", error);
            showNotification("Discordへの投稿に失敗しました。", true);
        }
    });
    
    // キャンセルボタンの処理
    cancelButton.addEventListener('click', () => {
        confirmationModal.classList.add('hidden');
    });    // モーダル外をクリックした時にモーダルを閉じる
    window.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            confirmationModal.classList.add('hidden');
        }
    });

    // 新規投稿ボタンの処理
    newPostButton.addEventListener('click', () => {
        // フォームをリセット
        form.reset();
        pavilionSelect.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.textContent = 'カテゴリを選択してください';
        pavilionSelect.appendChild(defaultOption);
        pavilionSelect.disabled = true;
        
        // 表示を切り替え
        resultDiv.classList.add('hidden');
        form.classList.remove('hidden');
    });

    // 通知を表示する関数
    function showNotification(message, isError) {
        notificationMessage.textContent = message;
        
        if (isError) {
            notification.classList.add('error');
        } else {
            notification.classList.remove('error');
        }
        
        notification.classList.remove('hidden');
        
        // 3秒後に通知を非表示にする
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    // Discordにメッセージを送信する関数
    async function sendToDiscord(message) {
        // 実際の実装では、サーバーサイドのAPIを経由することをお勧めします
        // フロントエンドから直接Discordウェブフックを呼び出すとトークンが露出するリスクがあります
        
        // デモ用の実装（実際の実装ではAPIを使用してください）
        if (DISCORD_WEBHOOK_URL === "YOUR_DISCORD_WEBHOOK_URL_HERE") {
            // テスト環境では成功を模擬
            return Promise.resolve();
        }
        
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: message
            }),
        });
        
        if (!response.ok) {
            throw new Error(`Discord API error: ${response.status}`);
        }
        
        return response;
    }
});
