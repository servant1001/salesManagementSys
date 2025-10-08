<template>
    <div>
        <el-button type="primary" @click="toggleScanner">
            {{ scanning ? "停止掃描" : "開始掃描" }}
        </el-button>

        <video ref="video" width="320" height="240" style="border:1px solid #ccc; border-radius: 8px; margin-top: 10px;"
            v-show="scanning"></video>
    </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { BrowserMultiFormatReader } from "@zxing/library";

const video = ref < HTMLVideoElement | null > (null);
const scanning = ref(false);
const codeReader = new BrowserMultiFormatReader();

const emit = defineEmits(["onScan"]); // 向父元件傳遞掃描結果

function toggleScanner() {
    if (!scanning.value) startScanner();
    else stopScanner();
}

function startScanner() {
    scanning.value = true;

    codeReader.decodeFromVideoDevice(
        null,
        video.value,
        (resultObj, err) => {
            if (resultObj) {
                const text = resultObj.getText();
                emit("onScan", text); // 傳給父元件
                // 改成持續掃描，不自動停止
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

onBeforeUnmount(() => stopScanner());
</script>
