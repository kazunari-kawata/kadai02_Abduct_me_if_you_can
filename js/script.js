$(function () {
    //キャラクター画像
    const playerImg = new Image();
    playerImg.src = "../materials/player.png";

    const alienImg1 = new Image();
    alienImg1.src = "../materials/alien1.png";

    const alienImg2 = new Image();
    alienImg2.src = "../materials/alien2.png";

    const alienImg3 = new Image();
    alienImg3.src = "../materials/alien3.png";

    const alienImg4 = new Image();
    alienImg4.src = "../materials/alien4.png";

    const alienImg5 = new Image();
    alienImg5.src = "../materials/alien5.png";

    // 配列にエイリアンをまとめて
    const alienImages = [alienImg1, alienImg2, alienImg3, alienImg4, alienImg5];

    //他のBGMなどは別のところにあるが、audio_gamOverだけはonGameOverとの兼ね合いでここに配置
    const audio_oh_no = new Audio("../materials/oh-no.mp3");
    audio_oh_no.volume = 0.6;
    const audio_gameOver = new Audio("../materials/Audio_gameover.mp3");
    audio_gameOver.volume = 0.1;

    //ウェーブアタック
    let wave = 0;
    const waveDuration = 20;

    let lastStickY = 0;
    let lastStickX = 0;
    let lastShakeTime = 0;

    const $canvas = $("#gameCanvas");
    const canvas = $canvas[0];
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // プレイヤー初期設定
    const player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 20,
        color: "white",
        speed: 5,
        baseSpeed: 8,
        stuckAliens: 0, // 速度低下用
    };

    let gameStarted = false;
    let gameOver = false;
    let keys = {};

    // ゲームオーバー処理
    function onGameOver() {
        gameOver = true;

        //BGM止める
        bgm.pause();
        audio_oh_no.currentTime = 0;
        audio_oh_no.play();
        audio_gameOver.currentTime = 0;
        audio_gameOver.play();

        $("#gameOver-wrapper").addClass("visible");
        $("#gameOver").html(
            `Game Over <br>
            Time: ${(elapsedTime / 1000).toFixed(1)} s`
        );
    }
    function resetGame() {

        gameOver = false;
        $("#gameOver-wrapper").css("display", "");
        $("#gameOver-wrapper").removeClass("visible");

        gameOver = false;
        gameStarted = false;

        player.x = canvas.width / 2;
        player.y = canvas.height / 2;
        player.stuckAliens = 0;
        player.speed = player.baseSpeed;

        aliens.forEach((a) => (a.stuck = false));
        aliens.length = 0;

        keys = {};
        wave = 0;
        startTime = performance.now();

        lastShakeTime = 0;
        lastStickX = 0;
        lastStickY = 0;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    // リトライボタン
    $("#retryBtn").on("click", function () {
        resetGame();
        bgm.currentTime = 0;
        bgm.play();
        gameStarted = true;
        gameLoop();
    });
    $("#backHome").on("click", function () {
        location.reload();
    });

    const aliens = [];

    // エイリアン出現処理
    function spawnAlien() {
        //画面の上下左右からランダム出現
        console.log(aliens);
        const margin = 50;
        let x, y;
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0:
                x = Math.random() * canvas.width;
                y = -margin;
                break; // 上
            case 1:
                x = Math.random() * canvas.width;
                y = canvas.height + margin;
                break; // 下
            case 2:
                x = -margin;
                y = Math.random() * canvas.height;
                break; // 左
            case 3:
                x = canvas.width + margin;
                y = Math.random() * canvas.height;
                break; // 右
        }

        const isHoming = Math.random() < 0.3; // 30%でホーミング
        const idx = Math.floor(Math.random() * alienImages.length);
        const img = alienImages[idx];
        aliens.push({
            x,
            y,
            radius: 15,
            color: isHoming ? "red" : "green",
            speed: 3 + Math.random(),
            isHoming,
            angle: Math.random() * Math.PI * 2, // 非ホーミング用
            stuck: false,
            img,
        });
    }

    function drawAliens() {
        for (const alien of aliens) {
            const size = alien.radius * 4;
            if (alien.img && alien.img.complete) {
                ctx.drawImage(
                    alien.img,
                    alien.x - size / 2,
                    alien.y - size / 2,
                    size,
                    size
                );
            } else {
                // ロード前や img が未設定の場合のフォールバック
                ctx.fillStyle = alien.color;
                ctx.beginPath();
                ctx.arc(alien.x, alien.y, alien.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function moveAliens() {
        for (const alien of aliens) {
            if (alien.isHoming) {
                // プレイヤーを追う
                const dx = player.x - alien.x;
                const dy = player.y - alien.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    alien.x += (dx / dist) * alien.speed;
                    alien.y += (dy / dist) * alien.speed;
                }
            } else {
                // 非ホーミング：直進
                alien.x += Math.cos(alien.angle) * alien.speed;
                alien.y += Math.sin(alien.angle) * alien.speed;
            }
        }
    }

    function drawPlayer() {
        const w = player.radius * 5;
        const h = player.radius * 5;

        if (playerImg.complete) {
            ctx.drawImage(playerImg, player.x - w / 2, player.y - h / 2, w, h);
        } else {
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 時間計測
    let startTime = 0;
    let elapsedTime = 0;

    function gameLoop() {
        if (gameStarted && !gameOver) {
            update();
            requestAnimationFrame(gameLoop);
        }
    }

    // スタートボタン押下
    $("#start-btn").on("click", function () {
        $("#start-screen").hide();
        $(".grid").hide();
        gameStarted = true;

        startTime = performance.now();
        aliens.length = 0;

        bgm.currentTime = 0;
        bgm.play();

        gameLoop();
    });

    // 一定間隔でエイリアン出現
    setInterval(() => {
        const numToSpawn = Math.min(
            10,
            Math.floor(Math.random() * 3) + 1 + wave
        );
        for (let i = 0; i < numToSpawn; i++) {
            spawnAlien();
        }
    }, 800);

    // 十字キーでも操作できるように
    $(document).on("keydown", (e) => (keys[e.key] = true));
    $(document).on("keyup", (e) => (keys[e.key] = false));

    // BGMや効果音
    const bgm = new Audio("../materials/bgm.mp3");
    bgm.loop = true;
    bgm.volume = 0.3;

    const audio_alien_stuck = new Audio("../materials/Audio_alien_stuck.mp3");
    audio_alien_stuck.volume = 0.2;

    const audio_alien_unstuck = new Audio(
        "../materials/Audio_alien_unstuck.mp3"
    );
    audio_alien_unstuck.volume = 0.5;

    // ウェーブインディケータ
    function flashWave(n) {
        $("#waveIndicator")
            .text(`WAVE ${n}`)
            .stop(true)
            .fadeIn(200)
            .delay(800)
            .fadeOut(200)
            .fadeIn(200)
            .delay(800)
            .fadeOut(200)
            .fadeIn(200)
            .delay(800)
            .fadeOut(200);
    }

    // !実際のプレイ中の処理はここから
    function update() {
        if (gameOver) return;
        elapsedTime = performance.now() - startTime;

        //ウェーブアタック
        const totalSec = Math.floor(elapsedTime / 1000);
        const newWave = Math.floor(totalSec / waveDuration);
        if (newWave !== wave) {
            wave = newWave;
            // オプション: ウェーブアップを画面に一瞬表示
            if (wave > 0) {
                flashWave(wave);
                for (let i = 0; i < wave * 10; i++) {
                    spawnAlien();
                }
            }
        }

        // 吸着数に応じて速度低下（最低1まで）
        player.speed = Math.max(1, player.baseSpeed - player.stuckAliens * 2);

        // 入力処理
        if (keys["ArrowUp"]) player.y -= player.speed;
        if (keys["ArrowDown"]) player.y += player.speed;
        if (keys["ArrowLeft"]) player.x -= player.speed;
        if (keys["ArrowRight"]) player.x += player.speed;

        const gp = navigator.getGamepads?.()[0];
        if (gp && gp.axes) {
            const threshold = 0.2;
            const axisX = gp.axes[0];
            const axisY = gp.axes[1];

            if (Math.abs(axisX) > threshold) player.x += axisX * player.speed;
            if (Math.abs(axisY) > threshold) player.y += axisY * player.speed;

            // エイリアンを振り払う
            const deltaY = Math.abs(axisY - lastStickY);
            const deltaX = Math.abs(axisX - lastStickX);

            const now = performance.now();

            if (
                (deltaY > 1.2 && now - lastShakeTime > 500) ||
                (deltaX > 1.2 && now - lastShakeTime > 500)
            ) {
                let unstuckCount = 0;
                for (let i = aliens.length - 1; i >= 0; i--) {
                    if (aliens[i].stuck) {
                        aliens.splice(i, 1);
                        unstuckCount++;
                    }
                }
                player.stuckAliens = 0;
                audio_alien_unstuck.currentTime = 0;
                audio_alien_unstuck.play();
                console.log(`エイリアン${unstuckCount}体を振り払った！`);
                lastShakeTime = now;
            }

            lastStickY = axisY;
            lastStickX = axisX;
        }

        // エイリアンがプレイヤーを引きずり出す動作
        if (player.stuckAliens > 0) {
            const dragForce = 0.7 * player.stuckAliens;

            // 画面の４辺までの距離を計算
            const distLeft = player.x;
            const distRight = canvas.width - player.x;
            const distTop = player.y;
            const distBottom = canvas.height - player.y;

            // 最も近い辺へ引きずる方向を決定
            const minDist = Math.min(distLeft, distRight, distTop, distBottom);
            let dx = 0,
                dy = 0;
            if (minDist === distLeft) dx = -dragForce;
            else if (minDist === distRight) dx = dragForce;
            else if (minDist === distTop) dy = -dragForce;
            else dy = dragForce;

            // プレイヤー座標を引きずる
            player.x += dx;
            player.y += dy;
        }

        // ゲームオーバー判定（画面外判定）
        if (
            player.x < -canvas.width * 0.05 ||
            player.x > canvas.width * 1.05 ||
            player.y < -canvas.height * 0.05 ||
            player.y > canvas.height * 1.05
        ) {
            onGameOver();
            return;
        }

        // エイリアン移動と描画
        moveAliens();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawAliens();
        drawPlayer();

        // エイリアンを追従ごとに管理
        for (const alien of aliens) {
            const dx = player.x - alien.x;
            const dy = player.y - alien.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const stuckRange = player.radius + alien.radius + 5;
            if (distance < stuckRange && !alien.stuck) {
                alien.stuck = true;
                player.stuckAliens += 1;
                audio_alien_stuck.currentTime = 0;
                audio_alien_stuck.play();
            }

            // 吸着済みのエイリアンはプレイヤーに追従（円周上に配置）
            if (alien.stuck) {
                const angle = Math.random() * Math.PI * 2;
                const offsetRadius = player.radius + 10 + Math.random() * 10;
                alien.x = player.x + Math.cos(angle) * offsetRadius;
                alien.y = player.y + Math.sin(angle) * offsetRadius;
            }
        }
        // 経過時間の算出
        const seconds = (elapsedTime / 1000).toFixed(1); // 1.2 のように小数第一位まで

        // 時間を Canvas に描画
        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = "40px 'ArcadeClassic' ,serif";
        ctx.textAlign = "center";
        ctx.fillText(`Time: ${seconds} s`, window.innerWidth / 2, 50);
        ctx.restore();
    }
});
