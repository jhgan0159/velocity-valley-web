document.addEventListener('DOMContentLoaded', () => {
    const introOverlay = document.getElementById('intro-overlay');
    const introVideo = document.getElementById('intro-video');
    const startIntroBtn = document.getElementById('start-intro-btn'); 
    const skipBtn = document.getElementById('skip-intro-btn');
    const bgMusicElement = document.getElementById('bg-music');

    function closeIntro() {
        if (!introOverlay) return;
        introOverlay.style.transition = "opacity 1s";
        introOverlay.style.opacity = "0";
        setTimeout(() => {
            introOverlay.style.display = "none";
            if(bgMusicElement) {
                bgMusicElement.volume = 0.5;
                bgMusicElement.play().catch(e => console.log("Bg music blocked", e));
            }
        }, 1000);
    }

    if (startIntroBtn && introVideo) {
        startIntroBtn.addEventListener('click', () => {
            introVideo.muted = false; 
            introVideo.volume = 1.0;
            introVideo.currentTime = 0;
          
            introVideo.play().then(() => {
                startIntroBtn.style.display = 'none'; 
                if(skipBtn) skipBtn.style.display = 'block';
            }).catch(e => console.log("Play failed", e));
        });
    }

    
    if (introVideo) {
        introVideo.addEventListener('ended', closeIntro);
    }

    
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            if(introVideo) introVideo.pause();
            closeIntro();
        });
    }

    const gameBoard = document.getElementById('game-board');
    const rollDiceBtn = document.getElementById('roll-dice-btn');
    const diceImage = document.getElementById('dice-image'); 
    const gameLog = document.getElementById('game-log');
    
    const currentPlayerName = document.getElementById('current-player-name');
    const currentPlayerColor = document.getElementById('current-player-color');

    const questionModal = document.getElementById('question-modal');
    const questionLevel = document.getElementById('question-level');
    const questionText = document.getElementById('question-text');
    const questionImage = document.getElementById('question-image'); 
    const answerBox = document.getElementById('answer-box');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');

    const explanationModal = document.getElementById('explanation-modal');
    const explanationTitle = document.getElementById('explanation-title');
    const explanationCorrectAnswer = document.getElementById('explanation-correct-answer');
    const explanationText = document.getElementById('explanation-text');
    const continueGameBtn = document.getElementById('continue-game-btn');

    const gameSetupModal = document.getElementById('game-setup-modal');
    const playerCountSelect = document.getElementById('player-count-select');
    const playerInputsContainer = document.getElementById('player-inputs-container'); 
    const startGameBtn = document.getElementById('start-game-btn');
    const gameContainer = document.querySelector('.game-container'); 
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const scoreList = document.getElementById('score-list');
    const roundCounter = document.getElementById('round-counter');
    const gameTimer = document.getElementById('game-timer');

    const powerupModal = document.getElementById('powerup-modal');
    const wheelDisplay = document.getElementById('wheel-display');
    const spinBtn = document.getElementById('spin-btn');
    const closePowerupBtn = document.getElementById('close-powerup-btn');

    const gameOverModal = document.getElementById('game-over-modal');
    const finalWinner = document.getElementById('final-winner');
    const finalAverage = document.getElementById('final-average');
    const exportBtn = document.getElementById('export-btn'); 

    let players = []; 
    let gameHistory = []; 
    const allPlayerColors = ["#E53935", "#1E88E5", "#43A047", "#FDD835"]; 
    
    let currentPlayerIndex = 0;
    let currentQuestionForChecking = null;
    let currentQuestionType = ''; 
    let gameInProgress = false; 
    const totalSquares = 25; 

    let currentRound = 1;
    let maxRounds = 10;

    let gameTimerInterval = null; 
    let totalSecondsPlayed = 0; 
    
    const boardLayout = {
        0: { x: 180, y: 43, type: "Start", name: "START" }, 
        1: { x: 280, y: 43, type: "C1_Question" }, 
        2: { x: 355, y: 43, type: "C1_Question" }, 
        3: { x: 435, y: 43, type: "C1_Question" }, 
        4: { x: 500, y: 43, type: "C1_Question" }, 
        5: { x: 580, y: 43, type: "C1_Question" }, 
        6: { x: 660, y: 43, type: "C1_Question" }, 
        7: { x: 780, y: 128, type: "C2_Question" }, 
        8: { x: 780, y: 214, type: "C2_Question" }, 
        9: { x: 780, y: 300, type: "C2_Question" }, 
        10: { x: 780, y: 385, type: "C2_Question" }, 
        11: { x: 780, y: 471, type: "C2_Question" }, 
        12: { x: 780, y: 557, type: "C2_Question" }, 
        13: { x: 660, y: 490, type: "C3_Question" }, 
        14: { x: 580, y: 490, type: "C3_Question" }, 
        15: { x: 500, y: 490, type: "C3_Question" }, 
        16: { x: 435, y: 490, type: "C3_Question" }, 
        17: { x: 355, y: 490, type: "C3_Question" }, 
        18: { x: 290, y: 490, type: "C3_Question" }, 
        19: { x: 160, y: 557, type: "C4_Question" }, 
        20: { x: 160, y: 471, type: "C4_Question" }, 
        21: { x: 160, y: 385, type: "C4_Question" }, 
        22: { x: 160, y: 300, type: "C4_Question" }, 
        23: { x: 160, y: 214, type: "C4_Question" }, 
        24: { x: 160, y: 128, type: "C4_Question" }, 
        25: { x: 160, y: 43, type: "Finish", name: "END" }  
    };

    const POWERUP_POOL = [
        { name: "⏱ Time Freeze", type: "time_freeze", desc: "Pauses your timer on NEXT turn" },
        { name: "🚫 Miss a Turn", type: "miss_turn", desc: "Skip next player's turn" },
        { name: "✈️ Teleport",    type: "teleport",    desc: "Move to any square" },
        { name: "💰 Jackpot",     type: "jackpot",     desc: "Get +3 Points instantly" },
        { name: "🏹 Robin Hood",  type: "robin_hood",  desc: "Steal 2 pts from Leader" }
    ];

    const defaultQuestionPools = {
       "C1_Question": [
            { level: "C1: Remembering", question: "Hubungan antara daya, F, jisim, m dan pecutan, a diberi oleh persamaan \nF = ma \nAntara yang berikut, manakah yang betul mewakili persamaan tersebut? \nA Hukum Gerakan Newton pertama\nB Hukum Gerakan Newton kedua\nC Hukum Gerakan Newton ketiga ", answer: ["B"], explanation: "Hukum Gerakan Newton Kedua menyatakan hubungan antara daya, jisim dan pecutan, yang dinyatakan oleh persamaan F = ma." },
            { level: "C1: Remembering", question: "Antara berikut, pernyataan manakah yang betul tentang berat? \nA Kuantiti vektor\nB Tetap di semua tempat\nC Pecutan graviti\nD Kuantiti jirim dalam sesuatu objek", answer: ["A"], explanation: "Berat ialah kuantiti vektor kerana mempunyai magnitud dan arah, iaitu ke arah pusat graviti." },
            { level: "C1: Remembering", question: "Antara kuantiti fizik berikut, yang manakah mempunyai unit m s⁻²?\nA Laju\nB Halaju\nC Pecutan\nD Sesaran", answer: ["C"], explanation: "Unit m s⁻² ialah unit bagi pecutan kerana pecutan ialah kadar perubahan halaju." },
            { level: "C1: Remembering", question: "Apakah nilai g? \nA 9.81 m s⁻¹\nB 9.81 m s⁻²\nC 10 m s⁻¹\nD 12.7 m s⁻¹", answer: ["B"], explanation: "Nilai g merujuk kepada pecutan graviti. Pecutan mesti mempunyai unit ms⁻², bukan ms⁻¹. Oleh itu, nilai standard pecutan graviti ialah 9.81 ms⁻²." },
            { level: "C1: Remembering", question: "Inersia sesuatu objek dipengaruhi oleh\nA Suhu\nB Jirim\nC Jisim\nD Kuantiti bahan", answer: ["C"], explanation: "Inersia ialah kecenderungan sesuatu objek untuk mengekalkan keadaan gerakannya (pegun atau bergerak lurus seragam). Inersia sesuatu objek bergantung kepada jisimnya – semakin besar jisim, semakin sukar objek itu untuk diubah gerakannya. Faktor lain seperti suhu atau jirim tidak menjejaskan inersia secara langsung." },
            { level: "C1: Remembering", question: "Antara berikut, yang manakah merupakan unit bagi momentum? \nA Ns\nB kg m s⁻¹\nC kg m s⁻²\nD kg⁻¹ s⁻²", answer: ["B"], explanation: "Momentum didefinisikan sebagai hasil darab jisim × halaju. Unit jisim ialah kg, unit halaju ialah m/s, maka unit momentum ialah kg·m/s atau kg m s⁻¹. Pilihan lain seperti Ns ialah unit impuls, kg m s⁻² ialah unit daya, dan kg⁻¹ s⁻² bukan unit fizik standard."},
            { level: "C1: Remembering", question: "Antara berikut, prinsip fizik manakah menyatakan bahawa jumlah momentum dalam sistem tertutup adalah kekal?\nA Prinsip Keabadian Tenaga\nB Prinsip Keabadian Momentum\nC Prinsip Inersia\nD Prinsip Keseimbangan Daya", answer: ["B"], explanation: "Prinsip Keabadian Momentum menyatakan bahawa jumlah momentum dalam sistem tertutup adalah kekal.  Dalam suatu pelanggaran, jumlah momentum sebelum pelanggaran adalah sentiasa sama dengan jumlah momentum selepas pelanggaran jika tiada daya luar bertindak ke atas sistem itu."},
            { level: "C1: Remembering", question: "Prinsip Keabadian Momentum menyatakan bahawa \nA Dalam suatu pelanggaran, jumlah momentum sebelum pelanggaran adalah sentiasa sama dengan jumlah momentum selepas pelanggaran jika tiada daya luar bertindak ke atas sistem itu\nB Dalam suatu pelanggaran, jumlah momentum sebelum pelanggaran adalah hasil tambah pelanggaran jika tiada daya luar bertindak ke atas sistem itu\nC Dalam suatu pelanggaran, jumlah momentum sebelum pelanggaran adalah lebih besar daripada jumlah momentum selepas pelanggaran jika tiada daya luar bertindak ke atas sistem itu", answer: ["A"], explanation: " Dalam suatu pelanggaran, jumlah momentum sebelum pelanggaran adalah sentiasa sama dengan jumlah momentum selepas pelanggaran jika tiada daya luar bertindak ke atas sistem itu. Prinsip Keabadian Momentum menyatakan bahawa jumlah momentum dalam sistem tertutup kekal sama sebelum dan selepas pelanggaran, selagi tiada daya luar bertindak ke atas sistem tersebut. Pilihan lain salah kerana ia menafikan konsep keabadian momentum atau memberikan pernyataan yang tidak tepat."},
            { level: "C1: Remembering", question: "Apakah unit SI bagi daya? \nA kg\nB J\nC N\nD M", answer: ["C"], explanation: "Unit SI bagi daya ialah Newton (N). Pilihan lain salah kerana: kg → unit jisim, J → unit tenaga, m → unit panjang."},
            { level: "C1: Remembering", question: "Apakah formula asas untuk mengira daya mengikut Hukum Newton Kedua? \nA F = m / g\nB F = m x a\nC F = a / m\nD F = m x v", answer: ["B"], explanation: "Formula asas untuk mengira daya mengikut Hukum Newton Kedua ialah F = m × a, di mana F = daya, m = jisim, dan a = pecutan. Pilihan lain salah kerana: F = m / g → bukan formula daya, F = a / m → susunan salah, F = m × v → ini ialah formula momentum, bukan daya."},
            { level: "C1: Remembering", question: "Jika jisim sesuatu objek adalah malar, hubungan antara daya, F dan pecutan, a ialah …. \nA F berkadar terus dengan a\nB F berkadar songsang dengan a\nC F tidak bergantung pada a	\nD F berkadar terus dengan jisim", answer: ["A"], explanation: "Graf daya, F melawan pecutan, a ialah garis lurus melalui titik asal. Ini menunjukkan bahawa apabila pecutan meningkat, daya turut meningkat secara berkadar terus. Hubungan ini menepati Hukum Newton Kedua, iaitu F = m x a. Dengan jisim malar, daya berkadar terus dengan pecutan."},
            { level: "C1: Remembering", question: "Inersia ditakrifkan sebagai …… \nA Kecenderungan objek untuk mengekalkan keadaan asalnya\nB Kadar perubahan halaju\nC Daya yang bertindak ke atas objek\nD Pecutan akibat graviti", answer: ["A"], explanation: "Inersia ialah kecenderungan objek untuk mengekalkan keadaan asalnya."},
            { level: "C1: Remembering", question: "Apakah maksud pecutan seragam?\nA Pecutan yang sifar\nB Pecutan yang berubah-ubah\nC Pecutan yang malar\nD Pecutan yang semakin berkurang", answer: ["C"], explanation: "Pecutan seragam bermaksud pecutan yang mempunyai nilai tetap."},
            { level: "C1: Remembering", question: "Inersia sesuatu objek bergantung kepada \nA Berat\nB Pecutan graviti\nC Jisim\nD Halaju", answer: ["C"], explanation: "Inersia sesuatu objek bergantung kepada jisimnya."},
            { level: "C1: Remembering", question: "Momentum ditakrifkan sebagai \nA hasil darab jisim dan halaju\nB hasil darab daya dan masa \nC kadar perubahan halaju\nD tenaga kinetik objek", answer: ["A"], explanation: "Momentum ditakrifkan sebagai hasil darab jisim dan halaju."},
            { level: "C1: Remembering", question: "Nyatakan faktor yang mempengaruhi pecutan.\nI	Daya\nII	Jisim\nIII	Kuasa\nIV 	Tenaga  \n \nA I dan II\nB I dan III\nC II dan IV\nD III dan IV", answer: ["A"], explanation: "Menurut Hukum Newton Kedua: a = F / m. Pecutan bergantung kepada magnitud daya yang bertindak dan jisim objek. Kuasa dan tenaga tidak menentukan pecutan secara langsung."},
            { level: "C1: Remembering", question: "Apabila suatu objek bergeak dengan halaju seragam, pecutannya akan \nA Sifar\nB Malar\nC Berkurang\nD Bertambah", answer: ["A"], explanation: "Halaju seragam bermaksud halaju tidak berubah. Oleh itu, kadar perubahan halaju adalah sifar. Maka, pecutan juga sifar."},
            { level: "C1: Remembering", question: "Antara berikut, yang manakah bukan kesan daya yang bertindak ke atas sebuah kereta yang sedang bergerak?\nA Jisim kereta itu berkurang\nB Halaju kereta itu bertambah\nC Halaju kereta itu berkurang\nD Arah gerakan kereta berubah", answer: ["A"], explanation: "Daya boleh menyebabkan perubahan halaju, arah gerakan, atau bentuk objek, tetapi tidak mengubah jisim sesuatu objek. Jisim ialah sifat jirim yang kekal."},
            { level: "C1: Remembering", question: "Apakah maksud berat ketara? \nA Berat sebenar objek\nB Daya graviti yang bertindak ke atas objek\nC Daya sokongan yang dialami oleh objek\nD Jisim objek", answer: ["C"], explanation: "Berat ketara ialah daya sokongan yang dialami oleh objek."},
            { level: "C1: Remembering", question: "Pita detik digunakan untuk mengkaji \nA Jisim objek\nB Daya yang bertindak \nC Gerakan objek\nD Tenaga objek", answer: ["C"], explanation: "Pita detik digunakan untuk mengkaji gerakan objek"}
       ],
        "C2_Question": [
            { level: "C2: Understanding", question: "Rajah 1 menunjukkan sebuah graf halaju melawan masa bagi sebuah kereta.  \nKereta itu bergerak dengan:\nA. pecutan seragam \nB. halaju seragam \nC. pecutan bertambah \nD. nyahpecutan seragam", answer: ["A"], explanation: "Bagi graf halaju-masa (v-t), kecerunan graf mewakili pecutan (a).\nGaris lurus dengan kecerunan positif menunjukkan pecutan adalah tetap (seragam).\nJika halaju seragam, garisan akan mendatar. Jika pecutan bertambah, garisan akan melengkung ke atas." , image: "images/imageS21.jpg"},
            { level: "C2: Understanding", question: "Rajah 3 menunjukkan daun dan bola golf dijatuhkan serentak di dalam bilik vakum. \nAntara berikut yang manakah menerangkan pergerakan daun dan bola golf?\nA. Daun dan bola golf jatuh dengan halaju seragam.\nB. Daun dan bola golf mempunyai tenaga kinetik yang sama.\nC. Daun dan bola golf sampai ke tanah pada masa yang sama.\nD. Daya graviti yang bertindak ke atas daun dan bola golf adalah sama.", answer: ["C"], explanation: "Di dalam vakum, tiada rintangan udara. Semua objek, tanpa mengira jisim atau bentuk, akan jatuh dengan pecutan graviti (g) yang sama. Oleh itu, kedua-duanya akan sampai ke tanah serentak. " , image: "images/imageS22.jpg"},
            { level: "C2: Understanding", question: "Rajah 4 menunjukkan sebuah lori tangki minyak petrol. \nLori tangki minyak petrol mempunyai tangki minyak yang terbahagi kepada beberapa bahagian berasingan untuk\nA. mengurangkan daya impuls\nB. memanjangkan masa impak\nC. menambahkan perubahan momentum\nD. mengurangkan impak inersia", answer: ["D"], explanation: "- Cecair di dalam tangki besar mempunyai jisim yang besar dan inersia yang tinggi.\n- Jika lori berhenti mengejut, inersia cecair akan menyebabkannya terus bergerak ke depan,  menghentam dinding tangki dan boleh menyebabkan lori hilang kawalan.\n- Pembahagian tangki (partition) mengurangkan pergerakan cecair dan mengurangkan kesan (impak) inersia cecair tersebut terhadap dinding lori." , image: "images/imageS23.jpg"},
            { level: "C2: Understanding", question: "Antara kenderaan berikut, yang manakah paling sukar untuk mula bergerak dari keadaan pegun? \nA. Sebuah kereta kompak\nB. Sebuah motosikal\nC. Sebuah bas sekolah yang penuh dengan penumpang\nD. Sebuah lori kosong", answer: ["C"], explanation: "Inersia adalah sifat objek yang menentang perubahan gerakan. Inersia berkadar terus dengan jisim. Bas yang penuh dengan penumpang mempunyai jisim yang paling besar antara semua pilihan, maka inersianya paling tinggi. Oleh itu, ia paling sukar untuk digerakkan." },
            { level: "C2: Understanding", question: "Apabila sos cili sukar dikeluarkan daripada botol, kita sering menggoncang botol itu dengan kuat dan memberhentikannya secara mengejut. Konsep fizik manakah yang menerangkan situasi ini? \nA. Prinsip Pascal\nB. Hukum Gerakan Newton Pertama\nC. Hukum Gerakan Newton Ketiga\nD. Prinsip Keabadian Momentum", answer: ["B"], explanation: "Sos di dalam botol bergerak bersama botol apabila digoncang. Apabila botol diberhentikan secara tiba-tiba, sos di dalamnya mempunyai inersia dan cenderung untuk terus bergerak ke hadapan, menyebabkan sos itu keluar dari mulut botol." },
            { level: "C2: Understanding", question: "Antara situasi berikut, yang manakah paling tepat menerangkan konsep inersia? \nA. Batu jatuh ke tanah disebabkan tarikan graviti. \nB. Kipas yang berpusing terus berputar seketika selepas suis dimatikan. \nC. Kereta memecut apabila pemandu menekan pedal minyak. \nD. Spring memanjang apabila beban digantung padanya.", answer: ["B"], explanation: "Inersia adalah kecenderungan objek untuk mengekalkan keadaan asalnya (sama ada pegun atau bergerak). Kipas yang terus berputar walaupun tiada daya elektrik menunjukkan ia ingin mengekalkan gerakan putarannya. " },
            { level: "C2: Understanding", question: "Apabila seekor anjing yang basah menggoncang badannya dengan kuat, titisan air terpercik keluar. Prinsip fizik manakah yang menerangkan fenomena ini? \nA. Prinsip Keabadian Momentum. \nB. Hukum Gerakan Newton Pertama. \nC. Hukum Gerakan Newton Kedua. \nD. Hukum Gerakan Newton Ketiga.", answer: ["B"], explanation: "Air pada badan anjing bergerak bersama gerakan badan. Apabila badan anjing menukar arah dengan pantas, air tersebut ingin terus bergerak lurus disebabkan sifat inersianya (Hukum Newton Pertama), lalu terlepas dari bulu anjing." },
            { level: "C2: Understanding", question: "Mengapakah pecutan sebuah roket semakin bertambah apabila ia naik tinggi ke atmosfera, dengan anggapan daya tujah enjin kekal sama? \nA. Tarikan graviti semakin bertambah.\nB. Rintangan udara semakin bertambah.\nC. Jisim roket semakin berkurang kerana bahan api terbakar.\nD. Suhu enjin semakin meningkat.", answer: ["C"], explanation: "Mengikut Hukum Newton Kedua (F=ma → a=F/m), pecutan berkadar songsang dengan jisim. Apabila bahan api digunakan, jisim roket berkurang, menyebabkan pecutan bertambah walaupun daya tujah (F) sama." },
            { level: "C2: Understanding", question: "Persamaan berikut adalah sebutan bagi satu kuantiti fizik dalam sebutan kuantiti asas. \nApakah kuantiti fizik yang dimaksudkan ?\nA Halaju\nB Momentum\nC Pecutan\nD Daya", answer: ["D"], explanation: "Daya, F=ma , m = jisim, a =pecutan = sesaran(panjang) / masa x masa." , image: "images/imageS29.jpg"},
            { level: "C2: Understanding", question: "Pita detik dapat dianalisis untuk menentukan: \nA Daya dan kerja suatu objek\nB Jarak dan laju suatu objek\nC. Jisim dan berat suatu objek \nD. Momentum dan tenaga kinetik suatu objek", answer: ["B"], explanation: "- Pita detik (ticker tape) adalah instrumen yang digunakan untuk mengkaji gerakan linear dalam makmal.\n- Mengapa B Betul (Jarak dan Laju):\nJarak: Kita boleh mengukur panjang pita detik menggunakan pembaris untuk mengetahui  jarak yang dilalui objek.\nMasa: Jangka masa detik memukul pita pada frekuensi tetap (biasanya 50 Hz, iaitu 0.02 saat setiap detik). Kita boleh mengira masa berdasarkan bilangan titik.\nLaju: Dengan adanya data Jarak dan Masa, kita boleh menghitung Laju (Laju = Jarak/Masa) dan juga Pecutan." },
            { level: "C2: Understanding", question: "Nyatakan kuantiti fizik yang diwakili oleh kecerunan dalam graf halaju-masa. \nA. Sesaran \nB. Pecutan \nC. Jarak \nD. Momentum", answer: ["B"], explanation: "Analisis Graf Halaju-Masa:\nPaksi-y mewakili Halaju (v).\nPaksi-x mewakili Masa (t).\nOleh itu, kecerunan graf = Perubahan Halaju/Perubahan Masa (△v/△t)\npecutan(a) = △v/△t" , image: "images/imageS31.jpg"},
            { level: "C2: Understanding", question: "Rajah 5 menunjukkan bulu pelepah dan bola dijatuhkan serentak di dalam bilik vakum.\nAntara pernyataan berikut yang manakah adalah betul?\nI. Bola akan sampai lantai terlebih dahulu\nII. Bola dan bulu pelepah mengalami jatuh bebas.\nIII. Bola mempunyai halaju lebih tinggi berbanding bulu pelepah.\nIV. Bulu pelepah dan bola akan sampai di lantai pada masa yang sama\nA. I dan II\nB. II dan III\nC. II dan IV\nD. III dan IV", answer: ["C"], explanation: "Betul : \nII - Jatuh bebas bermaksud objek jatuh hanya di bawah pengaruh daya graviti sahaja tanpa rintangan udara. Dalam vakum, kedua-dua objek (bola dan bulu) mengalami jatuh bebas.\nIV - Dalam keadaan jatuh bebas, semua objek jatuh dengan pecutan graviti (g) yang sama (9.81 m/s^2) tanpa mengira jisim atau bentuk.\nSalah:\nI - Mereka sampai serentak, bukan bola dahulu.\nIII - Halaju akhir (v = gt) bergantung kepada pecutan graviti dan masa. Kerana g dan t sama, halaju kedua-duanya adalah sama, bukan bola lebih tinggi." , image: "images/imageS32.jpg"},
            { level: "C2: Understanding", question: "Rajah 6 menunjukkan dua pelajar yang sedang meluncur ke arah P. \nApakah akan terjadi kepada pelajar perempuan itu apabila pelajar lelaki melepaskan pegangan tangannya? \nA Pegun\nB Bergerak ke P\nC Bergerak ke Q\nD Tenaga keupayaan pelajar itu", answer: ["B"], explanation: "Pelajar perempuan itu sudah pun mempunyai momentum dan sedang bergerak ke arah P bersama pelajar lelaki. Apabila pelajar lelaki (melepaskan pegangan), tiada daya baru yang dikenakan untuk mengubah arah gerakan pelajar perempuan itu. Disebabkan sifat inersia, pelajar perempuan itu akan mengekalkan arah gerakannya yang asal, iaitu terus meluncur ke arah P." , image: "images/imageS33.jpg"},
            { level: "C2: Understanding", question: "Mengapa atlet tersebut harus membengkokkan kakinya ketika mendarat dalam acara lompat jauh? \nI. Untuk mengurangkan impuls\nII. Untuk mengurangkan daya impuls\nIII. Untuk menambah masa hentaman\nIV. Untuk mendapat jarak paling maksimum\nA. I dan II\nB. I dan IV\nC. II dan III\nD. III dan IV", answer: ["C"], explanation: "II & III - Apabila atlet membengkokkan kaki, proses pendaratan mengambil masa yang lebih panjang. Masa hentaman (t) yang bertambah menyebabkan Daya Impuls (F) berkurang.\nF = △Perubahan Momentum /△Masa" },
            { level: "C2: Understanding", question: "Seorang angkasawan berjalan di permukaan bulan. \nApakah yang akan berlaku kepada inersia angkasawan tersebut jika angkasawan itu berjalan dengan sut yang sama di atas permukaan Bumi? \nA. Bertambah\nB. Berkurang\nC. Tidak Berubah", answer: ["C"], explanation: "Inersia ialah sifat sesuatu objek untuk menentang perubahan gerakan. Ukuran bagi inersia adalah jisim (m). Semakin besar jisim, semakin besar inersia. Kerana angkasawan itu memakai sut yang sama (tiada penambahan atau pengurangan jirim), jisimnya adalah kekal sama. Oleh itu, inersianya tidak berubah." , image: "images/imageS35.jpg"},
            { level: "C2: Understanding", question: "Menurut Hukum Newton Pertama, apakah yang akan berlaku kepada objek yang bergerak pada halaju malar jika tiada daya luar bertindak ke atasnya? \nA. Ia akan perlahan dan berhenti.\nB. Ia akan terus bergerak pada halaju malar dalam garis lurus.\nC. Ia akan memecut mengikut arah gerakan asal.\nD. Ia akan menukar arah tetapi mengekalkan kelajuan.", answer: ["B"], explanation: "Hukum Newton Pertama menyatakan bahawa objek akan terus bergerak dalam garis lurus pada halaju malar jika tiada daya luar bertindak ke atasnya. Tiada pecutan berlaku tanpa daya luar. " },
            { level: "C2: Understanding", question: "Contoh manakah yang paling tepat menggambarkan Hukum Newton Ketiga? \nA. Perenang menolak air ke belakang untuk menggerakkan dirinya ke hadapan.\nB. Bola yang dibaling ke atas akhirnya jatuh semula ke tanah.\nC. A Kereta menambah kelajuan apabila pedal minyak ditekan.\nD. Blok yang meluncur berhenti disebabkan geseran.", answer: ["A"], explanation: "Hukum Newton Ketiga menyatakan setiap tindakan ada tindak balas yang sama besar dan bertentangan arah. Perenang menolak air ke belakang (tindakan), dan air menolak perenang ke hadapan (tindak balas)" },
            { level: "C2: Understanding", question: "Apakah perbezaan asas antara jisim dan berat? \nA. Jisim diukur dalam Newton, manakala berat diukur dalam kilogram.\nB. Jisim berubah mengikut lokasi, manakala berat adalah tetap.\nC. Jisim ialah ukuran inersia, manakala berat ialah daya graviti ke atas objek.\nD. Jisim ialah kuantiti vektor, manakala berat ialah kuantiti skalar.", answer: ["C"], explanation: "Jisim ialah sifat fizik objek yang mengukur inersia, manakala berat ialah daya graviti yang bertindak ke atas objek. Berat bergantung pada medan graviti, tetapi jisim adalah tetap." },
            { level: "C2: Understanding", question: "Apabila bas berhenti secara tiba-tiba, penumpang tercampak ke hadapan. Fenomena ini disebabkan oleh: \nA. Hukum Newton Ketiga.\nB. Daya geseran.\nC. Pecutan bas.\nD. Inersia penumpang.", answer: ["D"], explanation: "Penumpang mempunyai inersia yang menyebabkan badan mereka cenderung mengekalkan gerakan asal walaupun bas berhenti secara tiba-tiba. Oleh itu, mereka tercampak ke hadapan." },
            { level: "C2: Understanding", question: "Seorang pelajar menendang bola sepak. Daya kaki pelajar pada bola ialah daya tindakan. Apakah daya tindak balasnya? \nA. Daya bola pada kaki pelajar.\nB. Daya bola pada tanah.\nC. Daya graviti ke atas bola.\nD. Rintangan udara ke atas bola.", answer: ["A"], explanation: "Tindakan (kaki menolak bola) mempunyai tindak balas yang sepadan: bola menolak kaki pelajar dengan daya yang sama besar dan bertentangan arah." }
        ],
        "C3_Question": [
            { level: "C3: Applying", question: "Rajah 2 menunjukkan sebuah kereta bergerak dengan halaju 20 m s. Kereta itu memperlahankan gerakan apabila menghampiri lampu isyarat merah. Kereta itu bergerak sejauh 50 m sebelum berhenti sepenuhnya. Berapakah pecutan kereta itu? \nA. 4.0 ms⁻² \nB. 8.0 ms⁻² \nC. -4.0 ms⁻² \nD. -8.0 ms⁻²", answer: ["C"], explanation: "Step 1: u = 20 m s⁻¹, s = 50 m, v = 0 m s⁻¹ \nStep 2: v² = u² + 2as \nStep 3: 0² = 20² + 2(a)(50) \n            0 = 400 + 100a \n           -400 = 100a \n            a = -400 / 100 a = -4.0 m s⁻²",image: "images/imageS41.jpg"},
            { level: "C3: Applying", question: "Sebuah troli X berjisim 6 kg dengan halaju 3 m s⁻¹ berlanggar secara elastik dengan satu lagi troli Y berjisim 3 kg dengan halaju 2 m s⁻¹. \nJika troli X berhenti sejurus selepas perlanggaran, hitungkan halaju akhir bagi troli Y. \nA. 4 m s⁻¹  \nB. 5 m s⁻¹  \nC. 8 m s⁻¹  \nD. 9 m s⁻¹ ", answer: ["C"], explanation: "Step 1: Troli 1: m1 = 6kg, u1 = 3 m s⁻¹, v1 = 0 m s⁻¹ \n            Troli 2: m2 = 3kg, u2 = 2 m s⁻¹, v2 = ? m s⁻¹ \nStep 2:  m1u1+m2u2 = m1v1+m2v2 \n             (6)(3) + (3)(2) = (6)(0) + (3) (v2) \n             24 = 0 + 3v2 \n             v2= 24/3 \n             v2= 8 m s⁻¹" },
            { level: "C3: Applying", question: "Seorang budak perempuan berlari dari titik X dalam trek bulatan berjejari 10 m. Berapakah sesaran budak perempuan itu, jika dia berlari sebanyak tiga pusingan dan berhenti di titik X? \nA. 0 m \nB. 30 m \nC. 63 m  \nD. 126 m", answer: ["A"], explanation: "Sesaran merupakan jarak terpendek antara kedudukan awal dengan kedudukan akhir pergerakan suatu objek pada satu arah tertentu. Kedudukan awal dan kedudukan akhir budak perempuan tersebut adalah sama. Oleh itu, sesaran ialah 0 m." },
            { level: "C3: Applying", question: "Jika berat di permukaan Bumi mengalami tarikan pecutan graviti 9.81 m s⁻², berapakah berat sebuah objek berjisim 20 kg di permukaan Bulan? \nA. 3.3 N \nB. 20.0 N \nC. 32.7 N \nD. 196.2 N", answer: ["C"], explanation: "Step 1: m = 20 kg, g(bumi) = 9.81 m s⁻², g(bulan) = 1/6 g(bumi)\nStep 2: g(bulan) = 1/6 x (9.81 m s⁻²) = 1.635 m s⁻²\nStep 3: W = mg \n            W = 20 kg × 1.635 m s⁻² \n            W = 32.7 N" },
            { level: "C3: Applying", question: "Sebiji bola lisut berjisim 0.8 kg dipukul oleh pemukul dengan daya 20 N. Jika daya dikenakan ke atas bola lisut dalam masa 0.5 s, berapakah impuls yang dialami oleh bola lisut itu?  \nA. 0.8 N s \nB. 2.0 N s\ nC. 10.0 N s \nD. 40.0 N s", answer: ["C"], explanation: "Step 1: m = 0.8 kg, F = 20 N, t = 0.5 s \nStep 2: Impuls = F × t \n            Impuls = 20 × 0.5 \n            Impuls = 10.0 N s" },
            { level: "C3: Applying", question: "Antara bongkah kayu berikut, yang manakah akan mengalami pecutan terkecil apabila dikenakan daya, F yang sama?", answer: ["D"], explanation: "F=ma \nKalau daya yang dikenakan, F adalah sama, semakin bertambah jisim, semakin berkurang pecutan.", image: "images/imageS46.jpg"},
            { level: "C3: Applying", question: "Ahmad melepaskan sebiji guli dari tepi meja setinggi 300 cm. Tentukan masa untuk guli itu sampai ke lantai? \nA 0.611 s \nB 0.782 s \nC 0.981 s \nD 1.635 s", answer: ["B"], explanation: "Step 1: s = 3m, g = 9.81 m s⁻²\nStep 2: s = ut + ½at²\n           3.0 = (0)(t) + ½(9.81) (t²)\n           3.0 = 4.905t²\n           t² = 3.0 / 4.905\n           t = √ (0.6116) \n           t = 0.782 s" },
            { level: "C3: Applying", question: "Seorang murid melambung sebiji bola ke atas dengan halaju 35 m s-1 seperti yang ditunjukkan dalam Rajah 1. Berapakah masa yang diambil oleh bola itu untuk kembali ke tangannya? \nA 3.00 s \nB 3.57 s \nC 5.50 s \nD 7.14 s", answer: ["D"], explanation: "Dari tangan ke titik maksimum:\nStep 1: u = 35 m s-1, g = -9.81 m s-2 (menentang arah), v = 0 m s-1, v=u+at\nStep 2: 0 = 35 + (-9.81)(t1) \n            0 = 35 - 9.81t1\n            t1 = 35 / 9.81 \n            t1 = 3.5678 s\nJumlah Masa, t= 2t1=7.14s", image: "images/imageS48.jpg"},
            { level: "C3: Applying", question: "Rajah 3 menunjukkan sebiji buah kelapa jatuh dari ketinggian 10 m dari sebatang pokok. Tentukan masa untuk buah kelapa itu sampai ke tanah. [Abaikan rintangan udara] \nA 1.02 s \nB 1.43 s \nC 1.96 s \nD 2.04 s", answer: ["B"], explanation: "Step 1: s = 10 m, g = 9.81 m s-2, u = 0 m s-1, s = ut + ½at²\nStep 2: 10 = (0)(t) + ½(9.81) (t²)\n            10 = 4.905t²\n            t2= 2.0387\n            t = 1.4278s" , image: "images/imageS48.jpg"},
            { level: "C3: Applying", question: "Satu objek berjisim 0.5 kg ditarik dengan satu daya 100 N selama 15 s. Berapakah impuls yang bertindak kepada objek tersebut?\nA 133 Ns \nB 750 Ns \nC 1500 Ns \nD 3000 Ns", answer: ["C"], explanation: "Step 1: F = 100 N, t = 15 s, m = 0.5 kg, Impuls = F x t\nStep 2: Impuls = 100 N x 15 s \n            Impuls = 1500 Ns" },
            { level: "C3: Applying", question: "Rajah 2 menunjukkan dua bola, P berjisim 1.0 kg dan Q berjisim 0.5 kg bergerak di atas permukaan licin. Jika kedua-dua bola itu melekat sejurus selepas perlanggaran, berapakah halaju akhir sepunya mereka? \nA - 3.00 m s⁻¹ \nB - 0.33 m s⁻¹ \nC 0.33 m s⁻¹ \nD 3.00 m s⁻¹", answer: ["B"], explanation: "Step 1: P: m1 = 1.0kg, u1 = 2 m s⁻¹\n            Q: m2 = 0.5kg, u2 = -5 m s⁻¹ (different direction)\n             v12 = ? m s⁻¹\nStep 2:  m1u1+m2u2 = (m1+m2)v12\n             (1)(2) + (0.5)(-5) = (1 + 0.5) (v12)\n             2 – 2.5 = 1.5 v12\n             v12 = -0.5/1.5\n             v2= -0.33 m s⁻¹" ,image: "images/imageS51.jpg"},
            { level: "C3: Applying", question: "Seorang atlet larian lelaki yang berjisim 50 kg berlari dengan daya 100 N. Hitungkan pecutannya. \nA 2 m s⁻² \nB 5 m s⁻² \nC 20 m s⁻² \nD 150 m s⁻²", answer: ["A"], explanation: "Step 1: m=50kg, F=100N, a= ? m s⁻²\nStep 2: F=ma\n            a=F/m\n          a=100/50\n          a= 2 m s⁻²" },
            { level: "C3: Applying", question: "Berat satu objek di permukaan bulan ialah 50 N. Berapakah jisim objek di permukaan bulan? \n[ Pecutan graviti di permukaan bulan = 1/6 pecutan graviti di permukaan bumi] \nA 300.58 kg \nB 30.58 kg \nC 8.33 kg \nD 0.83 kg", answer: ["B"], explanation: "Step 1: W = 50N, gbumi = 9.81 m s⁻², gbulan = 1/6 gbumi\nStep 2: gbulan = 1/6 x (9.81 m s⁻²) = 1.635 m s⁻²\nStep 3: W = mg \n            m=W/g\n            m = 50 N / 1.635 m s⁻² \n            m = 30.58kg" },
            { level: "C3: Applying", question: "Chong melontar sebiji batu secara menegak ke atas dengan halaju awal 20 m s⁻¹. Berapakah tinggi maksimum yang boleh dicapai oleh batu tersebut jika rintangan udara diabaikan? [Pecutan graviti, g = 9.81 m s⁻²] \nA 10.30 m \nB 20.39 m \nC 30.29 m \nD 40.30 m", answer: ["B"], explanation: "Dari tangan ke titik maksimum:\nStep 1: u = 20 m s-1, g = -9.81 m s-2 (menentang arah), v = 0 m s-1\nStep 2: v² = u² + 2as \n            0² = 20² + 2(-9.81)(s) \n            0 = 400 - 19.62s \n            19.62s = 400 \n            s = 400 / 19.62 \n            s = 20.39 m" },
            { level: "C3: Applying", question: "Rajah 2 menunjukkan sebahagian daripada keratan pita jangka masa detik diambil dari gerakan sebuah troli dalam eksperimen menggunakan jangka masa detik dengan frekuensi 50 Hz. Hitungkan pecutan troli itu. \nA 2.50 cm s⁻² \nB 3.12 cm s⁻² \nC 25 cm s⁻² \nD 3125 cm s⁻²", answer: ["D"], explanation: "Step 1: Tempoh, T = 1/50 = 0.02 s\n            u = 1cm/0.02 s = 50 cm s⁻¹\n            v = 6cm/0.02s = 300 cm s⁻¹\n            Masa, t = 4 detik x 0.02 s\n                       t = 0.08 s\nStep 2: a = (v - u) / t\n            a = (300 – 50)/0.08\n            a = 3125 cm s⁻²" , image: "images/imageS55.jpg"},
            { level: "C3: Applying", question: "Rajah 2 menunjukkan seorang budak lelaki menendang bola dengan daya 20 N. Jika bola tersebut bergerak dengan pecutan 50 m s⁻², berapakah jisim bola tersebut? \nA. 100 g\nB. 200 g\nC. 300 g\nD. 400 g", answer: ["D"], explanation: "Step 1: m=? kg, F=20N, a= 50 m s⁻²\nStep 2: F=ma\n           m=F/a\n           m=20/50\n           m= 400 g" , image: "images/imageS56.jpg"},
            { level: "C3: Applying", question: "Rajah 2 menunjukkan graf halaju-masa bagi satu objek yang bergerak dalam garis lurus. Hitung jumlah sesaran objek dalam masa 10 saat? \nA. 0 m \nB. 10 m \nC. 25 m\nD. 50 m", answer: ["D"], explanation: "Bagi graf halaju-masa, sesaran adalah sama dengan luas di bawah graf. Bentuk graf adalah segitiga.\nStep 1: Tapak = 10 s Tinggi = 10 m s-1\nStep 2: Sesaran = 0.5 x 10 x 10 = 50 m" , image: "images/imageS57.jpg"},
            { level: "C3: Applying", question: "Rajah 4 menunjukkan seorang budak menendang bola pegun dengan satu daya 6 N. Selepas 2 s daya itu dikenakan, halaju bola itu ialah 28 m s-1. Berapakah jisim bola itu? \nA. 0.20 kg\nB. 0.43 kg\nC. 2.33 kg\nD. 4.67 kg", answer: ["B"], explanation: "Step 1: F = 6 N, t = 2 s , u= 0 m s-1, v = 28 m s-1\nStep 2: Impuls: F x t = m(v - u)\n                        6 x 2 = m(28 - 0)\n                        m = 12 / 28 \n                        m = 0.4285kg" , image: "images/imageS58.jpg"},
            { level: "C3: Applying", question: "Sebiji bola plastisin berjisim 50 g dilontar dengan halaju 10 m s-1 dan telah berlanggar dengan dinding. Bola plastisin itu melekat pada dinding. Jika masa impak semasa perlanggaran ialah 0.4 s, berapakah magnitud daya impuls yang bertindak pada dinding itu? \nA. - 1250.00 N \nB. - 1.25 N \nC. 125.00 N \nD. 1250.00 N", answer: ["B"], explanation: "Step 1: m=0.05kg, u=10 m s-1, v= 0 m s-1, t = 0.4 s\nStep 2: F = (mv - mu) / t \n            F = (0.05(0) - 0.05(10)) / 0.4 \n            F = (0 - 0.5) / 0.4 \n            F = -0.5 / 0.4\n            F = -1.25 N" },
            { level: "C3: Applying", question: "Seorang budak lelaki menendang bola dengan daya 40 N. Jika bola tersebut bergerak dengan pecutan 90 m s⁻², berapakah jisim bola tersebut? \nA. 0.11 kg\nB. 0.22 kg\nC. 0.33 kg\nD. 0.44 kg", answer: ["D"], explanation: "Step 1: m=? kg, F=40N, a= 90 m s⁻²\nStep 2: F=ma\n           m=F/a\n           m=40/90\n           m= 0.44 kg" }
        ],
        "C4_Question": [
            { level: "C4: Analyzing", question: "Rajah 2 menunjukkan satu graf yang mewakili pergerakan sebuah kereta \nPernyataan manakah yang benar ?\nA Persamaan graf ialah v = t + 2 \nB Kecerunan graf ialah 5 m s-2 \nC Apabila t = 8, v = 2 \nD v berkadar terus dengan t ", answer: ["A"], explanation: "Pintasan-y pada graf bermula pada v=2, bermaksud halaju awal u=2. Kecerunan graf adalah seragam. Menggunakan persamaan linear y = mx + c, graf ini menepati persamaan v = t + 2." , image: "images/imageS61.jpg"},
            { level: "C4: Analyzing", question: "Seorang pen kick-boxing bertarung tanpa menggunakan sarung tangan, manakala seorang peninju bertarung memakai sarung tangan. Mengapakah pen kick-boxing berkemungkinan menyebabkan kecederaan yang lebih parah kepada lawannya? \nA. Sarung tangan meningkatkan jisim pukulan. \nB. Tanpa sarung tangan, masa impak menjadi lebih singkat, menyebabkan daya impuls yang lebih tinggi. \nC. Tanpa sarung tangan, perubahan momentum adalah lebih besar. \nD. Sarung tangan mengurangkan halaju tangan sebelum impak. ", answer: ["B"], explanation: "Formula daya impuls ialah F = p/t .Tanpa sarung tangan, masa hentaman (t) adalah singkat. Apabila t kecil, daya impuls (F) menjadi besar, menyebabkan kecederaan lebih parah." },
            { level: "C4: Analyzing", question: "Sebiji telur dijatuhkan ke atas lantai simen dan ke atas span tebal dari ketinggian yang sama. Pernyataan manakah yang benar mengenai hubungan antara masa impak (t) dan daya impuls (F)?\nA. Masa impak di atas permukaan lantai adalah lebih panjang, menghasilkan daya impulsyang lebih rendah.\nB. Masa impak di atas permukaan span adalah lebih singkat, menghasilkan daya impuls yang lebih tinggi.\nC. Daya impuls adalah berkadar terus dengan masa impak.\nD. Daya impuls adalah berkadar songsang dengan masa impak.", answer: ["D"], explanation: "Daya impuls berkadar songsang dengan masa impak . Span memanjangkan masa hentaman (t , tinggi), maka daya impuls (F) rendah. Lantai simen memendekkan masa hentaman (t rendah), maka daya impuls (F) tinggi." },
            { level: "C4: Analyzing", question: "Sebijii buah durian sedang jatuh dari pokok. Kuantiti fizik yang manakah yang kekal malar? \nA Halaju akhir \nB Masa jatuhan \nC Kadar perubahan halaju \nD Kadar perubahan sesaran", answer: ["C"], explanation: "Objek yang jatuh bebas dipengaruhi oleh daya graviti sahaja. Ia mengalami pecutan graviti (g) yang sentiasa malar. Pecutan ialah kadar perubahan halaju." },
            { level: "C4: Analyzing", question: "Rajah 3 menunjukkan daya-daya yang bertindak ke atas sebuah kapal terbang yang bergerak ke hadapan dengan satu pecutan. \nPernyataan yang manakah betul untuk menerangkan daya-daya yang bertindak ke atas kapal terbang itu?\nA Daya angkat < berat \nB Daya angkat >berat \nC Tujah ke hadapan >daya seretan \nD Daya seretan > tujah ke hadapan", answer: ["C"], explanation: "Mengikut Hukum Gerakan Newton Kedua (F=ma), untuk memecut ke hadapan (a > 0), daya bersih mesti bertindak ke hadapan. Oleh itu, Daya Tujah mesti lebih besar daripada Daya Seretan." , image: "images/imageS65.jpg"},
            { level: "C4: Analyzing", question: "Rajah menunjukkan graf jarak-masa dilalui oleh sebuah kereta yang bergerak \nJika kecerunan graf itu itu semakin bertambah, apakah yang akan berlaku terhadap gerakan kereta?\nA Kereta bergerak dengan pecutan negatif\nB Kereta bergerak dengan laju seragam yang lebih rendah\nC Kereta bergerak dengan laju seragam yang lebih tinggi\nD Kereta bergerak dalam arah yang bertentangan", answer: ["C"], explanation: "Kecerunan positif" , image: "images/imageS66.jpg"},
            { level: "C4: Analyzing", question: "Manakah antara langkah-langkah yang ditunjukkan dalam rajah tidak mengurangkan daya impuls? \nA Membengkokkan lulut semasa mendarat \nB Zon mudah remuk pada kenderaan  \nC Memakai tali pinggang keledar\nD Mendarat di atas tilam lembut ", answer: ["C"], explanation: "Membengkok lutut, Zon mudah remuk, Tilam: Semua ini berfungsi memanjangkan masa hentaman (t) untuk mengurangkan daya impuls (F).\nTali pinggang keledar: Fungsi utamanya adalah untuk mengurangkan kesan inersia" ,image: "images/imageS67.jpg"},
            { level: "C4: Analyzing", question: "Rajah menunjukkan bahagian zon remuk sebuah kereta \nMengapakah bahagian hadapan dan belakang sebuah kereta direka supaya  mudah remuk? \nA Untuk menambahkan geseran\nB Untuk mengurangkan impuls\nC Untuk mengurangkan momentum\nD Untuk menambahkan masa hentaman", answer: ["D"], explanation: "Meningkatkan masa hentaman akan mengurangkan daya impuls" ,image: "images/imageS68.jpg"},
            { level: "C4: Analyzing", question: "Yang manakah antara situasi berikut menunjukkan pecutan sifar? \nA Buah durian yang jatuh dari pokok \nB Bola jaring yang dibaling ke atas di awal permainan \nC Suatu daya 2 N yang bertindak ke atas kereta mainan yang berada di permukaan kasar dengan daya geseran sebanyak 2 N \nD Kapal terbang yang mendaki pada ketinggian tertentu", answer: ["C"], explanation: " Pecutan sifar bermaksud halaju seragam atau pegun (Daya bersih = 0). Dalam pilihan C, Daya dikenakan (2N) = Daya geseran (2N). Daya-daya adalah seimbang, maka pecutan sifar." },
            { level: "C4: Analyzing", question: "Rajah menunjukkan graf sesaran - masa bagi sebuah kereta yang sedang bergerak  s (m)", answer: ["A"], explanation: "P-Q: Kecerunan graf semakin curam (lengkung menaik) - Halaju bertambah.\nQ-R: Kecerunan graf semakin berkurang tetapi masih positif - Halaju berkurang pada arah yang sama." ,image: "images/imageS70.jpg"},
            { level: "C4: Analyzing", question: "Dalam situasi manakah blok itu bergerak dengan suatu pecutan? ", answer: ["D"], explanation: "ntuk objek memecut, perlu ada Daya Bersih (Unbalanced Force). Rajah D menunjukkan daya kiri dan kanan tidak seimbang (atau wujud komponen daya yang tidak dibatalkan), menghasilkan daya paduan bukan sifar." ,image: "images/imageS71.jpg"},
            { level: "C4: Analyzing", question: "Rajah  menunjukkan seorang atlit sedang melakukan lompat tinggi \nApakah fungsi tilam itu? \nA Mengurangkan masa perlanggaran antara atlit dengan tilam \nB Mengurangkan perubahan momentum atlit semasa kena tilam \nC Mengurangkan daya impuls yang bertindak ke atas atlit semasa kena tilam \nD Menambahkan daya impuls yang bertindak ke atas atlit semasa kena tilam ", answer: ["C"], explanation: "Tilam yang lembut memanjangkan masa perlanggaran/hentaman (t) antara atlet dan tilam. Masa yang panjang akan mengurangkan daya impuls." ,image: "images/imageS72.jpg"},
            { level: "C4: Analyzing", question: "Rajah menunjukkan graf halaju-masa bagi gerakan suatu objek.", answer: ["A"], explanation: "Kecerunan graf halaju-masa (v-t) mewakili pecutan (a).\nBahagian pertama graf  = Pecutan seragam (positif).\nBahagian kedua graf  = Tiada pecutan" ,image: "images/imageS73.jpg"},
            { level: "C4: Analyzing", question: "Rajah menunjukkan sebuah kereta bergerak dengan momentum yang lebih kecil daripada lori. \nMomentum kereta akan sama dengan lori apabila\nA halaju kereta sama dengan halaju lori.\nB halaju kereta lebih rendah dengan halaju lori. \nC halaju kereta lebih tinggi daripada halaju lori. \nD jisim kereta lebih rendah berbanding jisim lori. ", answer: ["C"], explanation: "Formula momentum p = mv. Oleh kerana jisim kereta yang kecil dan jisim lori yang besar, maka untuk mendapatkan momentum yang sama, halaju kereta mestilah lebih tinggi daripada lori." ,image: "images/imageS74.jpg"},
            { level: "C4: Analyzing", question: "Situasi manakah yang menghasilkan daya impuls yang tinggi? \nA.Telur di dalam karton\nB.Melompat dari satu ketinggian\nC.Menangkap bola lisut\nD.Menanam cerucuk", answer: ["D"], explanation: "Untuk menanam cerucuk ke dalam tanah, tukul besi dihentak ke atas permukaan cerucuk yang keras. Permukaan keras menyebabkan masa hentaman yang sangat singkat, menghasilkan daya impuls yang sangat tinggi untuk memecahkan tanah." },
            { level: "C4: Analyzing", question: "Rajah menunjukkan seorang budak lelaki dikejar oleh seekor lembu. Budak lelaki itu berlari secara zig-zag kerana dia tahu bahawa lembu itu akan mengalami kesukaran untuk mengubah pergerakan disebabkan oleh inersia lembu yang lebih besar berbanding dirinya. \nApakah yang menyebabkan inersia lebu itu lebih besar?\nA. Lembu berlari lebih laju daripada budak lelaki itu\nB. Lembu mempunyai saiz lebih besar daripada budak lelaki itu\nC. Lembu mempunyai jisim lebih besar daripada budak lelaki itu\nD. Lembu mempunyai kaki lebih panjang daripada budak lelaki itu", answer: ["C"], explanation: "Inersia adalah kecenderungan objek untuk mengekalkan keadaan asalnya. Satu-satunya faktor yang mempengaruhi inersia adalah Jisim. Jisim lembu besar, maka inersianya besar (susah ubah arah)." ,image: "images/imageS76.jpg"},
            { level: "C4: Analyzing", question: "Rajah menunjukkan seorang budak lelaki berlari dan melompat ke atas satu papan luncur yang pegun \nAntara pernyataan berikut yang manakah benar tentang situasi di atas?\nA.Situasi melibatkan letupan\nB Jumlah momentum sebelum perlanggaran adalah sifar\nC.Jumlah momentum sebelum perlanggaran adalah sama dengan jumlah momentum\nD Selepas perlanggaran, momentum budak itu adalah sama dengan momentum papan luncur", answer: ["C"], explanation: "Ini adalah situasi perlanggaran tidak kenyal. Mengikut Prinsip Keabadian Momentum, jumlah momentum sebelum perlanggaran adalah sentiasa sama dengan jumlah momentum selepas perlanggaran (jika tiada daya luar yang dikenakan)." ,image: "images/imageS77.jpg"},
            { level: "C4: Analyzing", question: "Rajah menunjukkan graf halaju-masa bagi gerakan sebuah kereta \nPernyataan manakah yang betul tentang gerakan tersebut?\nA. Kereta tersebut dalam keadaan pegun di PQ\nB. Kereta tersebut mengalami halaju seragam di RS\nC. Kereta bergerak ke arah bertentangan di QR\nD. Kereta tersebut mengalami pecutan seragam di ST", answer: ["B"], explanation: "Pada graf halaju-masa (v-t):\nGaris condong naik = Pecutan seragam.\nGaris mendatar (pada nilai v) = Halaju seragam (Pecutan sifar)\nGaris condong turun = Nyahpecutan." ,image: "images/imageS78.jpg"},
            { level: "C4: Analyzing", question: "Rajah menunjukkan susunan radas eksperimen ringkas untuk memahami konsep momentum \nApabila guli dilepaskan, pernyataan manakah benar?\nA Sudut kecondongan θ jarak kadbod nipis tertolak berkurang\nB. Jisim guli bertambah, jarak kadbod nipis tertolak berkurang\nC Ketinggian guli dilepaskan bertambah, jarak kadbod nipis tertolak bertambah\nD Kelajuan guli berkurang jarak kadbod nipis tertolak bertambah", answer: ["C"], explanation: "Tenaga Keupayaan Graviti (Ep = mgh). Apabila ketinggian (h) bertambah, tenaga keupayaan bertambah. Tenaga ini ditukar kepada Tenaga Kinetik yang lebih tinggi, membolehkan guli menolak kadbod lebih jauh " ,image: "images/imageS79.jpg"},
            { level: "C4: Analyzing", question: "Rajah menunjukkan graf perubahan sesaran, s dengan masa,t bagi satu objek", answer: ["B"], explanation: "Analisis kecerunan pada graf sesaran-masa (s-t):\ntp-tq : Halaju adalah sifar\ntq-tr: Halaju seragam (positif)\ntr-ts: Halaju seragam (negatif)" ,image: "images/imageS80.jpg"}
        ]
    };
    
    let customQuestions = null;
    try {
        const stored = localStorage.getItem('customQuestions');
        if (stored) {
            customQuestions = JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error loading custom questions", e);
    }

    const questionPools = (customQuestions && customQuestions["C1_Question"].length > 0) 
                          ? customQuestions 
                          : defaultQuestionPools;

    if (questionPools === customQuestions) console.log("USING CUSTOM QUESTIONS");

    function startMasterTimer() {
        gameTimerInterval = setInterval(() => {
            totalSecondsPlayed++;
            const minutes = Math.floor(totalSecondsPlayed / 60);
            const seconds = totalSecondsPlayed % 60;
            gameTimer.textContent = `Total Time: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            if (players[currentPlayerIndex]) {
                const p = players[currentPlayerIndex];
                if (!p.isTimeFrozen) {
                    p.timePlayed++;
                }
            }
            
            updateLeaderboard();
        }, 1000); 
    }

    function updateGameLog(message) { gameLog.textContent = message; }
    
    function updateLeaderboard() {
        scoreList.innerHTML = ''; 
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        
        sortedPlayers.forEach(player => {
            const li = document.createElement('li');
            
            const m = Math.floor(player.timePlayed / 60);
            const s = player.timePlayed % 60;
            const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            
            const frozenIcon = player.isTimeFrozen ? "❄️" : "⏱";
            const frozenStyle = player.isTimeFrozen ? "color: #2196F3;" : "color: #666;";

            li.innerHTML = `
                <span class="score-color-dot" style="background-color: ${player.color}"></span> 
                ${player.name}: ${player.score} pts 
                ${player.streak > 0 ? `(🔥${player.streak})` : ''} 
                <span style="font-size: 0.85em; margin-left: 8px; ${frozenStyle}"> ${frozenIcon} ${timeStr}</span>
            `;
            scoreList.appendChild(li);
        });
    }

    function generatePlayerNameInputs() {
        playerInputsContainer.innerHTML = '';
        const count = parseInt(playerCountSelect.value);
        for(let i=0; i<count; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Enter Player ${i+1} Name`;
            input.className = 'player-name-input';
            input.id = `player-name-input-${i}`;
            input.value = `Player ${i+1}`; 
            input.onfocus = function() { if(this.value.includes('Player')) this.value = ''; };
            input.onblur = function() { if(this.value.trim() === '') this.value = `Player ${i+1}`; };
            playerInputsContainer.appendChild(input);
        }
    }

    generatePlayerNameInputs();
    playerCountSelect.addEventListener('change', generatePlayerNameInputs);


    function startGame() {
        const numPlayers = parseInt(playerCountSelect.value);
        const roundsInput = document.getElementById('round-count-input');
        if (roundsInput && roundsInput.value) {
           maxRounds = parseInt(roundsInput.value);
           if (maxRounds < 1) maxRounds = 1; 
        }
        players = []; 
        gameHistory = []; 
        
        for (let i = 0; i < numPlayers; i++) {
            const nameInput = document.getElementById(`player-name-input-${i}`);
            let pName = nameInput.value.trim() || `Player ${i+1}`;

            players.push({
                id: i, name: pName, position: 0, previousPosition: 0, score: 0, 
                color: allPlayerColors[i], streak: 0, skipTurn: false,
                timePlayed: 0, 
                isTimeFrozen: false,
                pendingTimeFreeze: false 
            });
        }

        gameSetupModal.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        leaderboardContainer.classList.remove('hidden');
        gameInProgress = true;
        startMasterTimer(); 
        setupBoard();
    }

    function setupBoard() {
        gameBoard.innerHTML = ''; 
        for (let i = 0; i <= totalSquares; i++) {
            const squareData = boardLayout[i];
            if (!squareData) continue;
            const square = document.createElement('div');
            square.classList.add('square-path');
            square.dataset.squareId = i;
            square.style.left = `${squareData.x}px`;
            square.style.top = `${squareData.y}px`;
            gameBoard.appendChild(square);
        }
        players.forEach(player => {
            const token = document.createElement('div');
            token.id = `player-${player.id}`;
            token.classList.add('player-token');
            token.style.backgroundColor = player.color; 
            gameBoard.appendChild(token);
            movePlayerToken(player.id, 0, true);
        });
        updatePlayerUI();
        updateLeaderboard();
        roundCounter.textContent = `Round: 1 / ${maxRounds}`;
    }

    function movePlayerToken(playerIndex, position, instant = false) {
        const token = document.getElementById(`player-${playerIndex}`);
        const targetSquare = boardLayout[position];
        if (!targetSquare) return;
        const offsetX = (playerIndex % 2) * 15 - 7.5;
        const offsetY = Math.floor(playerIndex / 2) * 15 - 7.5;
        token.style.transition = instant ? 'none' : 'all 0.5s ease-in-out';
        token.style.left = `${targetSquare.x + offsetX}px`;
        token.style.top = `${targetSquare.y + offsetY}px`;
    }
    
    function updatePlayerUI() {
        if (players.length === 0) return; 
        const player = players[currentPlayerIndex];
        if (player.skipTurn) {
            updateGameLog(`${player.name} misses a turn!`);
            player.skipTurn = false; 
            setTimeout(nextTurn, 2000); 
            return;
        }
        currentPlayerName.textContent = player.name;
        currentPlayerColor.style.backgroundColor = player.color;
        gameLog.textContent = `${player.name}, your turn!`;
    }

    function rollDice() {
        if (!gameInProgress) return;
        const player = players[currentPlayerIndex];
        if (player.skipTurn) return;

        rollDiceBtn.disabled = true; 
        player.previousPosition = player.position;
        
        const roll = Math.floor(Math.random() * 6) + 1;
        diceImage.src = `/static/images/dice-${roll}.png`;
        
        player.position += roll;
        if (player.position > totalSquares) player.position = player.position % (totalSquares + 1); 
        
        updateGameLog(`${player.name} rolled a ${roll}!`);
        movePlayerToken(player.id, player.position);

        setTimeout(() => {
            let questionType;
            if (player.position === 0 || player.position === totalSquares) questionType = "Safe"; 
            else if (player.position <= 6) questionType = "C1_Question";
            else if (player.position <= 12) questionType = "C2_Question";
            else if (player.position <= 18) questionType = "C3_Question";
            else questionType = "C4_Question";

            if (questionType.includes("_Question")) {
                showQuestion(questionType);
            } else {
                updateGameLog("Safe square!");
                setTimeout(nextTurn, 1000);
            }
        }, 700);
    }

    function showQuestion(questionType) {
        const pool = questionPools[questionType];
        if (!pool || pool.length === 0) {
            updateGameLog("No questions in this pool.");
            setTimeout(nextTurn, 1000);
            return;
        }

        const q = pool[Math.floor(Math.random() * pool.length)];
        currentQuestionForChecking = { ...q }; 
        currentQuestionType = questionType; 

        if (q.image && q.image.trim() !== "") {
            questionImage.src = `/static/${q.image}`;
            questionImage.classList.remove('hidden');
            questionImage.onerror = function() { this.style.display = 'none'; };
        } else {
            questionImage.classList.add('hidden');
        }

        questionLevel.textContent = q.level;
        questionText.textContent = q.question;
        answerBox.value = ""; 
        questionModal.classList.remove('hidden');
        answerBox.focus();
    }

    function checkAnswer() {
        if (!currentQuestionForChecking) return; 

        const player = players[currentPlayerIndex];
        const userAnswer = answerBox.value.trim().toLowerCase();
        const rawAnswer = currentQuestionForChecking.answer;
        let isCorrect = false;

        if (Array.isArray(rawAnswer)) {
            isCorrect = rawAnswer.map(ans => ans.trim().toLowerCase()).includes(userAnswer);
        } else {
            isCorrect = (userAnswer === rawAnswer.trim().toLowerCase());
        }

        // --- RECORD DATA ---
        gameHistory.push({
            player: player.name,
            question: currentQuestionForChecking.question,
            studentAnswer: answerBox.value.trim(),
            result: isCorrect ? "Correct" : "Incorrect",
            scoreChange: isCorrect ? (currentQuestionType === "C4" ? 4 : 1) : -1 
        });

        questionModal.classList.add('hidden'); 

        if (isCorrect) {
            let points = 1;
            if (currentQuestionType === "C2_Question") points = 2;
            if (currentQuestionType === "C3_Question") points = 3;
            if (currentQuestionType === "C4_Question") points = 4;
            
            player.score += points;
            player.streak += 1; 
            updateGameLog(`Correct! +${points} pts.`);
            
            if (player.streak >= 3) {
                player.streak = 0; 
                setTimeout(() => activatePowerUpWheel(player), 1000); 
                return; 
            }
        } else {
            player.score -= 1; 
            player.streak = 0; 
            updateGameLog(`Wrong! -1 pt. Going back.`);
            player.position = player.previousPosition; 
            movePlayerToken(player.id, player.position);
        }
        
        updateLeaderboard(); 
        showExplanation(isCorrect, currentQuestionForChecking);
    }

    function activatePowerUpWheel(player) {
        powerupModal.classList.remove('hidden');
        wheelDisplay.textContent = "Click SPIN!";
        spinBtn.disabled = false;
        closePowerupBtn.classList.add('hidden');
        spinBtn.classList.remove('hidden');

        spinBtn.onclick = () => {
            spinBtn.disabled = true;
            let spins = 0;
            const interval = setInterval(() => {
                const randomOption = POWERUP_POOL[spins % POWERUP_POOL.length];
                wheelDisplay.textContent = randomOption.name;
                spins++;
            }, 100);

            setTimeout(() => {
                clearInterval(interval);
                const reward = POWERUP_POOL[Math.floor(Math.random() * POWERUP_POOL.length)];
                wheelDisplay.innerHTML = `<div style="font-size:1.5em; color:#E65100;">${reward.name}</div><div style="font-size:0.6em;">${reward.desc}</div>`;
                applyPowerUpEffect(reward.type, player);
                spinBtn.classList.add('hidden');
                closePowerupBtn.classList.remove('hidden');
            }, 2000);
        };

        closePowerupBtn.onclick = () => {
            powerupModal.classList.add('hidden');
            showExplanation(true, currentQuestionForChecking); 
        };
    }

    function applyPowerUpEffect(type, player) {
        if (type === "time_freeze") {
            player.pendingTimeFreeze = true; 
            updateGameLog(`❄️ Power-up stored! Time Freeze will apply on your NEXT turn.`);
            
        } else if (type === "miss_turn") {
            const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
            players[nextPlayerIndex].skipTurn = true;
        } else if (type === "teleport") {
            setTimeout(() => {
                let target = parseInt(prompt(`Teleport to square (0-25):`));
                if (!isNaN(target) && target >= 0 && target <= 25) {
                    player.position = target;
                    movePlayerToken(player.id, player.position);
                }
            }, 500);
        } else if (type === "jackpot") {
            player.score += 3;
        } else if (type === "robin_hood") {
            const sorted = [...players].sort((a, b) => b.score - a.score);
            let target = sorted[0]; 
            if (target.id === player.id) target = sorted[1];
            if (target && target.score > 0) {
                target.score -= 2; 
                player.score += 2; 
            }
        }
        updateLeaderboard();
    }
    
    function showExplanation(isCorrect, question) {
        questionModal.classList.add('hidden'); 
        explanationTitle.textContent = isCorrect ? "Correct!" : "Incorrect!";
        explanationTitle.className = isCorrect ? "correct" : "incorrect";
        explanationCorrectAnswer.textContent = `Answer: ${Array.isArray(question.answer) ? question.answer.join(" / ") : question.answer}`;
        explanationText.textContent = question.explanation;
        explanationModal.classList.remove('hidden');
    }

    function nextTurn() {
        if (!gameInProgress) return; 
        explanationModal.classList.add('hidden');
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        
        const player = players[currentPlayerIndex];
        if (player.pendingTimeFreeze) {
             player.pendingTimeFreeze = false;
             player.isTimeFrozen = true;
  
             setTimeout(() => {
                 updateGameLog(`❄️ ${player.name}'s Time Freeze ACTIVE! Timer paused 60s.`);
             }, 500);
             
             setTimeout(() => {
                 player.isTimeFrozen = false;
                 if (currentPlayerIndex === player.id) {
                     updateGameLog(`▶️ ${player.name}'s time resumed.`);
                 }
             }, 60000);
        }

        if (currentPlayerIndex === 0) {
            currentRound++; 
            if (currentRound > maxRounds) { endGame(); return; }
            roundCounter.textContent = `Round: ${currentRound} / ${maxRounds}`;
        }
        updatePlayerUI(); 
        rollDiceBtn.disabled = false;
    }

    function endGame() {
        clearInterval(gameTimerInterval); 
        gameInProgress = false;
        const sorted = [...players].sort((a, b) => b.score - a.score);
        finalWinner.textContent = `🏆 Winner: ${sorted[0].name} (${sorted[0].score} pts)`;
        finalAverage.textContent = `Avg Score: ${(players.reduce((a,b)=>a+b.score,0)/players.length).toFixed(2)}`;
        gameOverModal.classList.remove('hidden');
    }

    function exportGameData() {
        let workbookXML = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Arial" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="Arial" x:Family="Swiss" ss:Size="12" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#4CAF50" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellBorder">
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="Correct">
   <Font ss:Color="#008000" ss:Bold="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="Incorrect">
   <Font ss:Color="#FF0000" ss:Bold="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
 </Styles>`;

        workbookXML += '<Worksheet ss:Name="Overall Summary"><Table>';
        workbookXML += '<Column ss:Width="150"/><Column ss:Width="100"/><Column ss:Width="100"/><Column ss:Width="120"/><Column ss:Width="120"/>';
        
        workbookXML += '<Row>';
        ['Student Name', 'Total Score', 'Time Consumed', 'Correct Answers', 'Wrong Answers'].forEach(h => {
            workbookXML += `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`;
        });
        workbookXML += '</Row>';

        players.forEach(p => {
            const pHistory = gameHistory.filter(h => h.player === p.name);
            const correctCount = pHistory.filter(h => h.result === "Correct").length;
            const wrongCount = pHistory.filter(h => h.result === "Incorrect").length;
            
            const m = Math.floor(p.timePlayed / 60);
            const s = p.timePlayed % 60;
            const timeStr = `${m}m ${s}s`;

            workbookXML += '<Row>';
            workbookXML += `<Cell ss:StyleID="CellBorder"><Data ss:Type="String">${p.name}</Data></Cell>`;
            workbookXML += `<Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${p.score}</Data></Cell>`;
            workbookXML += `<Cell ss:StyleID="CellBorder"><Data ss:Type="String">${timeStr}</Data></Cell>`;
            workbookXML += `<Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${correctCount}</Data></Cell>`;
            workbookXML += `<Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${wrongCount}</Data></Cell>`;
            workbookXML += '</Row>';
        });
        workbookXML += '</Table></Worksheet>';

        players.forEach((p, index) => {
            workbookXML += `<Worksheet ss:Name="Player ${index + 1} - ${p.name}"><Table>`;
            workbookXML += '<Column ss:Width="350"/><Column ss:Width="150"/><Column ss:Width="100"/>';

            workbookXML += '<Row>';
            ['Question', 'Student Answer', 'Result'].forEach(h => {
                 workbookXML += `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`;
            });
            workbookXML += '</Row>';

            const pHistory = gameHistory.filter(h => h.player === p.name);
            if(pHistory.length === 0) {
                 workbookXML += '<Row><Cell><Data ss:Type="String">No questions answered yet.</Data></Cell></Row>';
            } else {
                pHistory.forEach(h => {
                    const style = h.result === "Correct" ? "Correct" : "Incorrect";
                    workbookXML += '<Row>';
                    const qText = h.question.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    const ansText = h.studentAnswer.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                    
                    workbookXML += `<Cell ss:StyleID="CellBorder"><Data ss:Type="String">${qText}</Data></Cell>`;
                    workbookXML += `<Cell ss:StyleID="CellBorder"><Data ss:Type="String">${ansText}</Data></Cell>`;
                    workbookXML += `<Cell ss:StyleID="${style}"><Data ss:Type="String">${h.result}</Data></Cell>`;
                    workbookXML += '</Row>';
                });
            }
            workbookXML += '</Table></Worksheet>';
        });

        workbookXML += '</Workbook>';

        const blob = new Blob([workbookXML], { type: 'application/vnd.ms-excel' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "PhysicsMonopoly_Report.xls";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    startGameBtn.addEventListener('click', startGame);
    rollDiceBtn.addEventListener('click', rollDice);
    submitAnswerBtn.addEventListener('click', checkAnswer);
    answerBox.addEventListener('keyup', (e) => { if (e.key === 'Enter') checkAnswer(); });
    continueGameBtn.addEventListener('click', nextTurn);
    exportBtn.addEventListener('click', exportGameData); 
});