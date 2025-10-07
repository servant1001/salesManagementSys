<template>
    <div>
        <h2>掃描器</h2>

        <button @click="toggleScanner">
            {{ scanning ? '停止掃描' : '開始掃描' }}
        </button>

        <video ref="video" width="320" height="240" style="border:1px solid black; margin-top:10px;"
            v-show="scanning"></video>

        <p>掃描結果：{{ result }}</p>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { BrowserMultiFormatReader } from "@zxing/library";

const video = ref(null);
const result = ref("");
const scanning = ref(false);

const codeReader = new BrowserMultiFormatReader();

function toggleScanner() {
    if (!scanning.value) {
        startScanner();
    } else {
        stopScanner();
    }
}

function startScanner() {
    scanning.value = true;

    codeReader.decodeFromVideoDevice(null, video.value, (resultObj, err) => {
        if (resultObj) {
            result.value = resultObj.getText();
            console.log("掃描到:", result.value);
        }
        if (err && err.name !== "NotFoundException") {
            console.error(err);
        }
    });
}

function stopScanner() {
    scanning.value = false;
    codeReader.reset();
    console.log("掃描已停止");
}
</script>
