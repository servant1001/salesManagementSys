<template>
    <div>
        <el-select v-model="selectedCameraId" placeholder="選擇鏡頭" style="width: 200px; margin-right: 10px;"
            @change="switchCamera">
            <el-option v-for="camera in cameras" :key="camera.deviceId" :label="camera.label || camera.deviceId"
                :value="camera.deviceId">
            </el-option>
        </el-select>

        <el-button type="primary" @click="toggleScanner">
            {{ scanning ? "停止掃描" : "開始掃描" }}
        </el-button>

        <video ref="video" width="320" height="240" style="border:1px solid #ccc; border-radius: 8px; margin-top: 10px;"
            v-show="scanning">
        </video>

        <!-- 掃描提示 -->
        <div v-if="scanMessage" style="margin-top: 10px; color: green; font-weight: bold;">
            {{ scanMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { BrowserMultiFormatReader } from "@zxing/library";

const video = ref<HTMLVideoElement | null>(null);
const scanning = ref(false);
const codeReader = new BrowserMultiFormatReader();
const cameras = ref<MediaDeviceInfo[]>([]);
const selectedCameraId = ref<string | null>(null);

const scanMessage = ref<string | null>(null); // 掃描成功訊息
let lastScanTime = 0;
const scanCooldown = 2000; // 2秒冷卻

const emit = defineEmits(["onScan"]); // 向父元件傳遞掃描結果

// 🔊 掃描提示音
const beepSound = new Audio("/scanner-beep.mp3");
// 請把 scanner-beep.mp3 放在 /public 資料夾下，例如：public/scanner-beep.mp3

// 取得可用攝像頭
async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameras.value = devices.filter(d => d.kind === "videoinput");

        const lastCameraId = localStorage.getItem("lastCameraId");
        if (lastCameraId && cameras.value.some(c => c.deviceId === lastCameraId)) {
            selectedCameraId.value = lastCameraId;
        } else if (cameras.value.length > 0) {
            selectedCameraId.value = cameras.value[0]?.deviceId ?? null;
        }
    } catch (err) {
        console.error("取得攝像頭失敗:", err);
    }
}

function toggleScanner() {
    if (!scanning.value) startScanner();
    else stopScanner();
}

function startScanner() {
    if (!video.value) return;
    scanning.value = true;

    codeReader.decodeFromVideoDevice(
        selectedCameraId.value,
        video.value,
        (resultObj, err) => {
            if (resultObj) {
                const now = Date.now();
                if (now - lastScanTime >= scanCooldown) {
                    lastScanTime = now;
                    const text = resultObj.getText();
                    emit("onScan", text);

                    // 播放音效
                    beepSound.currentTime = 0;
                    beepSound.play().catch(() => { /* 瀏覽器靜音狀態不報錯 */ });

                    setTimeout(() => (scanMessage.value = null), 2000);
                }
            }
            if (err && err.name !== "NotFoundException") {
                console.error(err);
            }
        }
    );
}

function stopScanner() {
    scanning.value = false;
    codeReader.reset();
}

// 切換鏡頭
function switchCamera() {
    if (scanning.value) {
        stopScanner();
        startScanner();
    }
    // 儲存選擇到 localStorage 下次直接默認前一次選擇的鏡頭
    if (selectedCameraId.value) {
        localStorage.setItem("lastCameraId", selectedCameraId.value);
    }
}

onMounted(() => getCameras());
onBeforeUnmount(() => stopScanner());
</script>
