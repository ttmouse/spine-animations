// python -m http.server
// http://localhost:8000


// 001 全局变量
let app = null;
let currentAnimation = null;
let backgroundSprite = null;
let isLandscape = false;

// 002 DOM 元素
const statusDiv = document.getElementById('status');
const gameScreen = document.getElementById('game-screen');
const spineFileSelect = document.getElementById('spine-file-select');
const animationSelect = document.getElementById('animation-select');


// 003 更新状态信息, 并滚动到底部,当消息超出10条，删除最旧的消息
function updateStatus(message) {
    console.log(message);
    statusDiv.innerHTML += message + '<br>';
    statusDiv.scrollTop = statusDiv.scrollHeight;
}


// 004 加载外部脚本
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// 005 加载必要的库
async function loadLibraries() {
    updateStatus('开始加载库...');
    try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pixi.js/5.3.7/pixi.min.js');
        updateStatus('PIXI.js 加载成功');
        await loadScript('https://cdn.jsdelivr.net/npm/pixi-spine@2.1.11/dist/pixi-spine.js');
        updateStatus('pixi-spine 加载成功');
        return true;
    } catch (error) {
        updateStatus(`加载库时出错: ${error.message}`);
        return false;
    }
}

// 006 检查库是否正确加载
function checkLibraries() {
    updateStatus('检查库是否正确加载...');
    if (typeof PIXI === 'undefined') {
        updateStatus('错误：PIXI 库未定义');
        return false;
    }
    updateStatus('PIXI 库已加载');

    if (typeof PIXI.spine === 'undefined') {
        updateStatus('错误：PIXI.spine 未定义，pixi-spine 可能未正确加载');
        return false;
    }
    updateStatus('PIXI.spine 已定义');

    return true;
}


// 007 获取目录中的Spine文件
async function getSpineFiles() {
    updateStatus('正在获取Spine文件列表...');
    try {
        const response = await fetch('/list-spine-files');
        updateStatus(`服务器响应状态: ${response.status}`);
        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        updateStatus(`服务器响应内容: ${text}`);
        const files = JSON.parse(text);
        updateStatus(`找到 ${files.length} 个Spine文件`);
        return files;
    } catch (error) {
        updateStatus(`获取Spine文件列表时出错: ${error.message}`);
        console.error('完整错误:', error);
        return [];
    }
}

// 008 初始化应用
async function initializeApp() {
    if (!await loadLibraries() || !checkLibraries()) {
        return;
    }

    app = new PIXI.Application({
        width: gameScreen.clientWidth,
        height: gameScreen.clientHeight,
        backgroundColor: 0x1099bb,
        transparent: false
    });
    gameScreen.appendChild(app.view);

    // 获取并填充 Spine 文件选择下拉列表
    const spineFiles = await getSpineFiles();
    spineFiles.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file;
        spineFileSelect.appendChild(option);
    });

    // 初始化背景图选择下拉列表
    await initBgImageSelect();

    // 添加事件监听器
    spineFileSelect.addEventListener('change', loadSpineAnimation);
    document.getElementById('load-spine').addEventListener('click', loadSpineAnimation);
    document.getElementById('apply-changes').addEventListener('click', applyAnimationSettings);
    document.getElementById('bg-image-select').addEventListener('change', applyBackground);
    animationSelect.addEventListener('change', changeAnimation);
    document.getElementById('toggle-orientation').addEventListener('click', toggleOrientation);
}


// 009 加载 Spine 动画
function loadSpineAnimation() {
    const spineFileName = spineFileSelect.value;
    if (!spineFileName) {
        updateStatus('请选择一个Spine文件');
        return;
    }

    updateStatus(`开始加载Spine动画: ${spineFileName}`);

    if (currentAnimation) {
        app.stage.removeChild(currentAnimation);
        currentAnimation = null;
    }

    // 确保文件名不包含 .json 扩展名
    const baseName = spineFileName.replace('.json', '');

    PIXI.Loader.shared
        .reset()
        .add(`${baseName}_spine`, `${baseName}.json`)
        .add(`${baseName}.atlas`)
        .add(`${baseName}.png`)
        .load((loader, resources) => {
            updateStatus('资源加载完成，检查文件...');

            if (!resources[`${baseName}_spine`] || !resources[`${baseName}.atlas`] || !resources[`${baseName}.png`]) {
                updateStatus('错误：某些必要文件未能加载');
                console.log('Loaded resources:', resources);
                return;
            }

            updateStatus('所有文件已加载，尝试创建 Spine 动画...');

            try {
                const spineData = resources[`${baseName}_spine`].spineData;
                if (!spineData) {
                    throw new Error('spineData is undefined');
                }
                currentAnimation = new PIXI.spine.Spine(spineData);

                updateStatus('Spine 动画对象已创建');

                // 清空并重新填充动画选择下拉菜单
                animationSelect.innerHTML = '';
                const animations = currentAnimation.spineData.animations;
                animations.forEach(animation => {
                    const option = document.createElement('option');
                    option.value = animation.name;
                    option.textContent = animation.name;
                    animationSelect.appendChild(option);
                });

                updateStatus(`找到 ${animations.length} 个动画`);

                applyAnimationSettings();

                // 播放第一个动画
                if (animations.length > 0) {
                    currentAnimation.state.setAnimation(0, animations[0].name, true);
                    updateStatus(`正在播放动画: ${animations[0].name}`);
                } else {
                    updateStatus('错误：未找到可播放的动画');
                    return;
                }

                app.stage.addChild(currentAnimation);
                updateStatus('动画已添加到舞台');
            } catch (error) {
                updateStatus('创建动画时出错: ' + error.message);
                console.error('完整错误:', error);
            }
        })
        .onError.add((error, loader, resource) => {
            updateStatus(`加载资源时出错: ${error.message}。资源: ${resource.url}`);
            console.error('加载错误:', error);
        });
}

// 010 更改当前播放的动画
function changeAnimation() {
    if (!currentAnimation) {
        updateStatus('请先加载Spine动画');
        return;
    }

    const selectedAnimation = animationSelect.value;
    currentAnimation.state.setAnimation(0, selectedAnimation, true);
    updateStatus(`切换到动画: ${selectedAnimation}`);
}

// 011 应用动画设置
function applyAnimationSettings() {
    if (!currentAnimation) {
        updateStatus('请先加载Spine动画');
        return;
    }

    const x = parseFloat(document.getElementById('x-pos').value);
    const y = parseFloat(document.getElementById('y-pos').value);
    const scale = parseFloat(document.getElementById('scale').value);
    const rotation = parseFloat(document.getElementById('rotation').value);

    currentAnimation.position.set(x, y);
    currentAnimation.scale.set(scale);
    currentAnimation.rotation = rotation * (Math.PI / 180);

    updateStatus(`应用新设置 - X: ${x}, Y: ${y}, 缩放: ${scale}, 旋转: ${rotation}°`);
}

// 012 应用背景
function applyBackground() {
    const bgImageSelect = document.getElementById('bg-image-select');
    const bgImageName = bgImageSelect.value;
    if (!bgImageName) {
        updateStatus('请选择背景图');
        return;
    }

    updateStatus(`正在加载背景图: ${bgImageName}`);

    // 移除现有的背景精灵（如果有的话）
    if (backgroundSprite) {
        app.stage.removeChild(backgroundSprite);
        backgroundSprite.destroy();
    }

    // 使用时间戳创建唯一的资源键
    const uniqueKey = `background_${Date.now()}`;

    // 创建新的加载器实例
    const loader = new PIXI.Loader();

    // 加载新的背景图
    loader.add(uniqueKey, bgImageName)
        .load((loader, resources) => {
            if (resources[uniqueKey] && resources[uniqueKey].texture) {
                backgroundSprite = new PIXI.Sprite(resources[uniqueKey].texture);
                
                // 调用 adjustBackground 来正确设置背景
                adjustBackground();
                
                // 将背景添加到舞台的最底层
                app.stage.addChildAt(backgroundSprite, 0);
                
                updateStatus(`背景图设置成功: ${bgImageName}`);
            } else {
                updateStatus(`加载背景图失败: ${bgImageName}`);
                console.error('加载的资源:', resources);
            }

            // 清理加载器资源
            loader.reset();
        })
        .onError.add((error, loader, resource) => {
            updateStatus(`加载背景图时出错: ${error.message}`);
            console.error('背景加载错误:', error);
            console.error('问题资源:', resource);
            // 清理加载器资源
            loader.reset();
        });
}

// 013 切换横竖屏
function toggleOrientation() {
    isLandscape = !isLandscape;
    const phoneContainer = document.getElementById('phone-container');
    const gameScreen = document.getElementById('game-screen');

    if (isLandscape) {
        phoneContainer.style.transform = 'rotate(-90deg)';

    } else {
        phoneContainer.style.transform = 'rotate(0deg)';
    }

    // 调整 PIXI 应用的大小
    app.renderer.resize(app.renderer.width, app.renderer.height);

    // 调整背景
    adjustBackground();

    // 重新应用动画设置以调整位置
    applyAnimationSettings();
}

// 014 调整背景
function adjustBackground() {
    if (backgroundSprite) {
        // 重置变换
        backgroundSprite.setTransform(0, 0, 1, 1, 0, 0, 0, 0, 0);

        const texture = backgroundSprite.texture;
        const screenRatio = app.screen.width / app.screen.height;
        const textureRatio = texture.width / texture.height;

        if (isLandscape) {
            // 横屏模式
            backgroundSprite.rotation = 0; // 不旋转背景，因为整个容器已经旋转了

            if (screenRatio > textureRatio) {
                // 屏幕比图片更宽
                const scale = app.screen.height / texture.height;
                backgroundSprite.scale.set(scale);
                backgroundSprite.position.set((app.screen.width - texture.width * scale) / 2, 0);
            } else {
                // 屏幕比图片更窄
                const scale = app.screen.width / texture.width;
                backgroundSprite.scale.set(scale);
                backgroundSprite.position.set(0, (app.screen.height - texture.height * scale) / 2);
            }
        } else {
            // 竖屏模式 (保持原有的逻辑)
            if (screenRatio > textureRatio) {
                // 屏幕比图片更宽
                const scale = app.screen.width / texture.width;
                backgroundSprite.scale.set(scale);
                backgroundSprite.position.set(0, (app.screen.height - texture.height * scale) / 2);
            } else {
                // 屏幕比图片更窄
                const scale = app.screen.height / texture.height;
                backgroundSprite.scale.set(scale);
                backgroundSprite.position.set((app.screen.width - texture.width * scale) / 2, 0);
            }
        }
    }
}


// 015 获取背景图列表
async function getBgImages() {
    updateStatus('正在获取背景图像列表...');
    try {
        const response = await fetch('http://localhost:8000/list-bg-images');
        updateStatus(`服务器响应状态: ${response.status}`);
        if (!response.ok) {
            throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
        }
        const text = await response.text();
        updateStatus(`服务器响应内容: ${text}`);
        const images = JSON.parse(text);
        updateStatus(`找到 ${images.length} 个背景图`);
        return images;
    } catch (error) {
        updateStatus(`获取背景图列表时出错: ${error.message}`);
        console.error('完整错误:', error);
        return [];
    }
}

// 初始化背景图选择下拉列表
async function initBgImageSelect() {
    try {
        const bgImages = await getBgImages();
        const bgImageSelect = document.getElementById('bg-image-select');
        if (!bgImageSelect) {
            throw new Error('无法找到 bg-image-select 元素');
        }
        bgImageSelect.innerHTML = '<option value="">选择背景图</option>'; // 清空并添加默认选项
        bgImages.forEach(image => {
            const option = document.createElement('option');
            option.value = image;
            option.textContent = image;
            bgImageSelect.appendChild(option);
        });
        updateStatus(`背景图下拉列表已更新，共 ${bgImages.length} 个选项`);
    } catch (error) {
        updateStatus(`初始化背景图列表时出错: ${error.message}`);
        console.error('初始化背景图列表错误:', error);
    }
}




// 初始化应用
initializeApp();