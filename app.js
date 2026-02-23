let scene, camera, renderer, controls, model;
let anatomyData = {};
let selectedMesh = null; // 現在選択されている部位

// 1. JSONデータの読み込み
fetch('data.json')
    .then(response => response.json())
    .then(data => { anatomyData = data; init(); });

function init() {
    // 2. 基本セットアップ
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1, 3);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    // ライト設定
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    // 3. 3Dモデル(.glb)の読み込み
    const loader = new THREE.GLTFLoader();
    // ※ここに実際のモデルファイル名を指定します
    loader.load('muscles.glb', (gltf) => {
        model = gltf.scene;
        // 全パーツの材質を透明操作可能に設定
        model.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
                child.material.transparent = true;
            }
        });
        scene.add(model);
    });

    // 4. クリック（タップ）判定
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    window.addEventListener('pointerdown', (e) => {
        // ボタン類をクリックした場合は無視
        if(e.target.tagName === 'BUTTON') return;

        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        if(model) {
            const intersects = raycaster.intersectObject(model, true);
            if (intersects.length > 0) {
                // クリックされたパーツを取得
                selectedMesh = intersects[0].object;
                const partId = selectedMesh.name; // モデルのメッシュ名をIDとして使う

                if (anatomyData[partId]) {
                    showInfo(anatomyData[partId]);
                }
            } else {
                hideInfo();
            }
        }
    });

    animate();
}

// 5. UIの更新処理
function showInfo(data) {
    document.getElementById('name').textContent = data.name;
    document.getElementById('type').textContent = data.type;
    document.getElementById('action').textContent = data.action;
    document.getElementById('origin').textContent = data.origin;
    document.getElementById('infoPanel').classList.remove('hidden');
}

function hideInfo() {
    document.getElementById('infoPanel').classList.add('hidden');
    selectedMesh = null;
}

// 6. ボタンのアクション（半透明・非表示・リセット）
document.getElementById('btnFade').addEventListener('click', () => {
    if (selectedMesh) { selectedMesh.material.opacity = 0.2; hideInfo(); }
});

document.getElementById('btnHide').addEventListener('click', () => {
    if (selectedMesh) { selectedMesh.visible = false; hideInfo(); }
});

document.getElementById('btnReset').addEventListener('click', () => {
    if (model) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.visible = true;
                child.material.opacity = 1.0;
            }
        });
    }
});

// 描画ループ
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
