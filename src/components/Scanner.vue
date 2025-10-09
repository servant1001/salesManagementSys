<template>
    <div>
        <el-select v-model="selectedCameraId" placeholder="選擇鏡頭" @change="switchCamera"
            style="width: 250px; margin-bottom: 10px;">
            <el-option v-for="camera in cameras" :key="camera.deviceId" :label="camera.label"
                :value="camera.deviceId"></el-option>
        </el-select>

        <el-button type="primary" @click="toggleScanner">
            {{ scanning ? "停止掃描" : "開始掃描" }}
        </el-button>

        <video id="video" autoplay muted playsinline
            style="width: 320px; height: 240px; margin-top: 10px; border: 1px solid #ccc;"></video>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { ElMessage } from "element-plus";

const scanning = ref(false);
const cameras = ref<{ deviceId: string; label: string }[]>([]);
const selectedCameraId = ref<string | null>(null);

let codeReader: BrowserMultiFormatReader | null = null;
let controls: IScannerControls | null = null;

const emit = defineEmits(["onScan"]);

// 取得攝像頭列表
async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        cameras.value = videoDevices.map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Camera ${d.deviceId}`,
        }));
        if (videoDevices.length > 0 && videoDevices[0]?.deviceId) {
            selectedCameraId.value = videoDevices[0].deviceId;
        }
    } catch (err) {
        console.error("取得攝影機失敗", err);
        ElMessage.error("取得攝影機失敗");
    }
}

// 開始掃描
async function startScanner(deviceId: string) {
    if (!deviceId) return;
    const videoElem = document.getElementById("video") as HTMLVideoElement;
    codeReader = new BrowserMultiFormatReader();

    try {
        scanning.value = true;

        controls = await codeReader.decodeFromVideoDevice(
            deviceId,
            videoElem,
            (result: any, err: any) => {
                if (result) {
                    console.log("掃描成功:", result.text);
                    emit("onScan", result.text);
                    ElMessage.success(`掃描成功: ${result.text}`);
                }
                if (err) {
                    // 忽略 NotFoundException，避免頻繁報錯
                    if (err.name !== "NotFoundException") console.warn("掃描錯誤:", err);
                }
            }
        );
    } catch (err) {
        console.error("掃描啟動失敗:", err);
        ElMessage.error("掃描啟動失敗");
        scanning.value = false;
    }
}

// 停止掃描
function stopScanner() {
    scanning.value = false;
    if (controls) {
        controls.stop();
        controls = null;
    }
    codeReader = null;
    ElMessage.info("掃描已停止");
}

// 切換鏡頭
function switchCamera(deviceId: string) {
    if (scanning.value && deviceId) {
        stopScanner();
        setTimeout(() => startScanner(deviceId), 300); // 確保攝像頭釋放後再啟動
    }
}

// 開關掃描
function toggleScanner() {
    if (!scanning.value && selectedCameraId.value) startScanner(selectedCameraId.value);
    else stopScanner();
}

onMounted(() => getCameras());
onBeforeUnmount(() => stopScanner());
</script>
