<template>
    <div class="scanner-panel">
        <div class="scanner-toolbar">
            <el-select v-model="selectedCameraId" placeholder="選擇鏡頭" class="camera-select" @change="switchCamera">
                <el-option v-for="camera in cameras" :key="camera.deviceId" :label="camera.label || camera.deviceId"
                    :value="camera.deviceId" />
            </el-select>

            <el-button type="primary" class="scanner-toggle-btn" @click="toggleScanner">
                {{ scanning ? "停止掃描" : "開始掃描" }}
            </el-button>
        </div>

        <p v-if="permissionMessage" class="scanner-alert scanner-alert--error">
            {{ permissionMessage }}
        </p>

        <video ref="video" width="320" height="240" class="scanner-video" v-show="scanning" />

        <div v-if="scanMessage" class="scan-message">
            {{ scanMessage }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { BrowserMultiFormatReader } from "@zxing/library";

const emit = defineEmits<{
    (e: "onScan", value: string): void;
}>();

const video = ref<HTMLVideoElement | null>(null);
const scanning = ref(false);
const codeReader = new BrowserMultiFormatReader();
const cameras = ref<MediaDeviceInfo[]>([]);
const selectedCameraId = ref<string | null>(null);
const scanMessage = ref<string | null>(null);
const permissionMessage = ref<string | null>(null);
const beepSound = new Audio("/scanner-beep.mp3");

let lastScanTime = 0;
const scanCooldown = 2000;

defineExpose({
    stopScanner,
});

async function requestCameraPermission() {
    try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        permissionMessage.value = null;
        await getCameras();
    } catch (error) {
        console.error("取得相機權限失敗", error);
        permissionMessage.value = "請先允許相機權限，才能開始掃描條碼。";
    }
}

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        cameras.value = devices.filter((device) => device.kind === "videoinput");

        const lastCameraId = localStorage.getItem("lastCameraId");
        if (lastCameraId && cameras.value.some((camera) => camera.deviceId === lastCameraId)) {
            selectedCameraId.value = lastCameraId;
            return;
        }

        selectedCameraId.value = cameras.value[0]?.deviceId ?? null;
    } catch (error) {
        console.error("讀取鏡頭列表失敗", error);
    }
}

function toggleScanner() {
    if (scanning.value) {
        stopScanner();
        return;
    }

    startScanner();
}

function startScanner() {
    if (!video.value) return;

    scanning.value = true;
    scanMessage.value = "鏡頭已啟動，請將條碼對準畫面中央。";

    codeReader.decodeFromVideoDevice(selectedCameraId.value, video.value, (result, error) => {
        if (result) {
            const now = Date.now();
            if (now - lastScanTime < scanCooldown) return;

            lastScanTime = now;
            const text = result.getText();
            emit("onScan", text);
            scanMessage.value = `已掃描：${text}`;

            beepSound.currentTime = 0;
            beepSound.play().catch(() => undefined);

            window.setTimeout(() => {
                if (scanMessage.value?.startsWith("已掃描：")) {
                    scanMessage.value = null;
                }
            }, 2000);
        }

        if (error && error.name !== "NotFoundException") {
            console.error(error);
        }
    });
}

function stopScanner() {
    scanning.value = false;
    codeReader.reset();
    scanMessage.value = "已停止掃描";
}

function switchCamera() {
    if (selectedCameraId.value) {
        localStorage.setItem("lastCameraId", selectedCameraId.value);
    }

    if (scanning.value) {
        stopScanner();
        startScanner();
    }
}

onMounted(() => {
    void requestCameraPermission();
});

onBeforeUnmount(() => {
    stopScanner();
});
</script>

<style scoped>
.scanner-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.scanner-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
}

.camera-select {
    width: 200px;
    min-width: 0;
}

.scanner-toggle-btn {
    min-width: 124px;
    min-height: 44px;
    border-color: rgba(214, 164, 107, 0.42);
    border-radius: 14px;
    background:
        radial-gradient(circle at top right, rgba(255, 228, 178, 0.34), transparent 44%),
        linear-gradient(135deg, #b97837 0%, #d6a46b 54%, #f0c998 100%);
    color: #10243c;
    font-weight: 700;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.3),
        0 16px 28px rgba(185, 122, 55, 0.2);
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        filter 0.18s ease,
        border-color 0.18s ease;
}

.scanner-toggle-btn:hover,
.scanner-toggle-btn:focus-visible {
    transform: translateY(-1px);
    border-color: rgba(214, 164, 107, 0.62);
    color: #10243c;
    filter: saturate(1.06);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.34),
        0 20px 32px rgba(185, 122, 55, 0.28);
}

.scanner-alert {
    margin: 0;
    padding: 12px 14px;
    border-radius: 14px;
    line-height: 1.6;
    font-size: 0.92rem;
}

.scanner-alert--error {
    border: 1px solid rgba(217, 78, 78, 0.18);
    background: rgba(217, 78, 78, 0.08);
    color: #b43c3c;
}

.scanner-video {
    max-width: 100%;
    border: 1px solid rgba(20, 36, 58, 0.12);
    border-radius: 18px;
    background: linear-gradient(180deg, rgba(250, 251, 253, 0.95), rgba(243, 246, 250, 0.95));
    box-shadow: 0 16px 32px rgba(16, 36, 58, 0.08);
}

.scan-message {
    color: #1d8f50;
    font-weight: 700;
}

@media (max-width: 640px) {
    .scanner-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .camera-select,
    .scanner-toggle-btn {
        width: 100%;
    }

    .scanner-video {
        width: 100%;
        height: auto;
    }
}
</style>
