import JsBarcode from 'jsbarcode'

/**
 * 根據 name 與 gtin 產生一維條碼 (Base64 圖片)
 * @param name 商品名稱
 * @param gtin 商品 GTIN
 * @returns Promise<string> Base64 圖片資料 (dataURL)
 */
export function generateBarcodeImage(name: string, gtin: string, price: number): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            // 先畫出條碼
            const canvas = document.createElement('canvas')
            JsBarcode(canvas, gtin, {
                format: 'CODE128',
                width: 2.9,
                height: 80,
                displayValue: true,
                text: `${gtin}`,//`${gtin}-${price.toString().padStart(4, '0')}`,
                fontSize: 18,
                margin: 5,
                textMargin: -3,
            })

            const barcodeImg = canvas.toDataURL('image/png')
            const img = new Image()

            img.onload = () => {
                const finalCanvas = document.createElement('canvas')
                const ctx = finalCanvas.getContext('2d')!
                finalCanvas.width = img.width
                finalCanvas.height = img.height + 50

                // 背景白
                ctx.fillStyle = '#fff'
                ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

                // 商品名稱自動縮放函數
                function drawTextFit(text: string, y: number) {
                    let fontSize = 16
                    ctx.font = `${fontSize}px sans-serif`
                    ctx.textAlign = 'center'
                    while (ctx.measureText(text).width > finalCanvas.width - 20 && fontSize > 8) {
                        fontSize--
                        ctx.font = `bold ${fontSize}px sans-serif`
                    }
                    ctx.fillText(text, finalCanvas.width / 2, y)
                }

                ctx.fillStyle = '#000'
                drawTextFit(`${name} 特價$${price}`, 32)

                // 貼上條碼
                ctx.drawImage(img, 0, 35)

                resolve(finalCanvas.toDataURL('image/png'))
            }

            img.onerror = reject
            img.src = barcodeImg
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * 下載條碼圖片
 */
export function downloadBarcode(name: any, gtin: any, dataUrl: string) {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${name}-${gtin}.png`
    link.click()
}
