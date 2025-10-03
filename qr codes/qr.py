import qrcode

urls = [
    "file:///C:/Users/KraVe/Desktop/factory_hack/t-bank-queue/index.html?event=event1",
    "file:///C:/Users/KraVe/Desktop/factory_hack/t-bank-queue/index.html?event=event2"
]

for i, url in enumerate(urls, start=1):
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    img.save(f"qr_code_event{i}.png")

print("QR codes generated successfully.")
