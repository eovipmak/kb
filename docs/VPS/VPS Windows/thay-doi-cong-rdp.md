# Hướng dẫn thay đổi cổng RDP trên Windows

Nếu bạn cần hỗ trợ, xin vui lòng liên hệ hotline **1900 6046 nhánh 3**, hoặc gửi email đến [**support@vinahost.vn**](mailto:support@vinahost.vn), hoặc chat trực tiếp với chúng tôi tại [**đây**](https://livechat.vinahost.vn/chat.php).


## 1. Sử dụng Powershell

### a.  Mở Powershell với quyền quản trị viên

![Mở Powershell](images/windows-thay_doi_cong_rdp-01.jpg)

### b. Kiểm tra cổng RDP đang dùng

Sao chép và dán lệnh sau vào Powershell, sau đó nhấn Enter để chạy:

```powershell
Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -name "PortNumber"
```

Đầu ra của Powershell chứa số cổng đang dùng:
```powershell
PortNumber   : 3389
```

3389 là cổng Windows RDP mặc định

### c. Thay đổi cổng RDP

Chạy lệnh sau trong Powershell:

```powershell title="Powershell"
Set-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp' -name "PortNumber" -Value <port>
```
    
Thay `<port>` ở cuối lệnh trên bằng số cổng mà bạn muốn

### d.  Tạo quy tắc tường lửa mới để cho phép Windows sử dụng cổng vừa chỉ định

Chạy lần lượt 2 lệnh sau trong Powershell:

```powershell title="Powershell" linenums="1"
New-NetFirewallRule -DisplayName 'RDPPORTLatest-TCP-In' -Profile 'Public' -Direction Inbound -Action Allow -Protocol TCP -LocalPort <port>
New-NetFirewallRule -DisplayName 'RDPPORTLatest-UDP-In' -Profile 'Public' -Direction Inbound -Action Allow -Protocol UDP -LocalPort <port>
```
Thay `<port>` ở cuối lệnh trên bằng số cổng mà bạn đã chỉ định tại **bước 3**

## 2. Sử dụng Registry Editor

### a. Mở Registry Editor với quyền quản trị viên

![Mở Registry Editor](images/windows-thay_doi_cong_rdp-02.jpg)

### b. Điều hướng đến khoá registry cần sửa

Nhập chuỗi dưới đây vào thanh điều hướng rồi nhấn Enter:

```
HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\Terminal Server\WinStations\RDP-Tcp
```

![Điều hướng đến khoá registry cần sửa](images/windows-thay_doi_cong_rdp-03.jpg)
        
### c. Sửa khoá registry

Khoá registry có tên **PortNumber** quy định số cổng RDP. Nhấp đôi chuột vào khoá này, chọn **Decimal** để hiện số cổng dạng thập phân.

![Hiện giá trị khoá registry dạng thập phân](images/windows-thay_doi_cong_rdp-04.jpg)

Nhập số cổng mong muốn vào trường **Value data**, nhấn **OK** để thay đổi.

![Sửa giá trị khoá registry](images/windows-thay_doi_cong_rdp-05.jpg)

=> Khởi động lại Windows để áp dụng thay đổi

## 3. Kết luận

Như vậy là VinaHost đã hướng dẫn bạn 2 cách để **thay đổi cổng RDP trên Windows**. Chúc bạn thực hiện thành công!

> **THAM KHẢO CÁC DỊCH VỤ TẠI [VINAHOST](https://vinahost.vn/)**
>
> **\>> [SERVER](https://vinahost.vn/thue-may-chu-rieng/) – [COLOCATION](https://vinahost.vn/colocation.html) – [CDN](https://vinahost.vn/dich-vu-cdn-chuyen-nghiep)**
> **\>> [CLOUD](https://vinahost.vn/cloud-server-gia-re/) – [VPS](https://vinahost.vn/vps-ssd-chuyen-nghiep/)**
> **\>> [HOSTING](https://vinahost.vn/wordpress-hosting)**
> **\>> [EMAIL](https://vinahost.vn/email-hosting)**
> **\>> [WEBSITE](http://vinawebsite.vn/)**
> **\>> [TÊN MIỀN](https://vinahost.vn/ten-mien-gia-re/)**