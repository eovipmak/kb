Bài viết này sẽ hướng dẫn cách tạo domain trên CDN tại Vinahost. Nếu bạn cần hỗ trợ, xin vui lòng liên hệ VinaHost qua Hotline 1900 6046 ext.3, email về support@vinahost.vn hoặc chat với VinaHost qua livechat https://livechat.vinahost.vn/chat.php.
## Hướng Dẫn Tạo Domain CDN Tại VINAHOST
CDN (Content Delivery Network): thông thường sẽ có 2 loại Content Acceleration và Media Acceleration — hai cách tối ưu khác nhau cho từng loại nội dung.  
- Content Acceleration (Tăng tốc nội dung thông thường)  
-  Media Acceleration (Tăng tốc nội dung media, đặc biệt là VOD)
  
Tại đây mình sẽ hướng dẫn tạo bằng domain trên Media Acceleration, việc cấu hình trên Content Acceleration sẽ tương tự.
#### Bước 1: Đăng nhập hệ thống quản lý CDN
Truy cập vào trang quản lý CDN được cung cấp khi đăng ký dịch vụ tại VINAHOST.
![image](https://github.com/user-attachments/assets/73d11ae4-2657-4fd2-acbe-5b45899cc285)

#### Bước 2: Truy cập Media Acceleration
Tại menu **Media Delivery**, chọn **Media Acceleration**.
![image](https://github.com/user-attachments/assets/54f5396e-62a0-422c-9d1b-46d9968cef9e)

#### Bước 3: Tạo mới domain CDN
Trong giao diện **Configuration**, chọn **Create new domain**.
![image](https://github.com/user-attachments/assets/0efe54bf-cb58-4019-b47c-54a44c71d60a)

#### Bước 4: Cấu hình thông tin domain

Tại tab **Domain Information**:

- **Contract-Item**: Chọn hợp đồng (Contract-Item) có sẵn.
![image](https://github.com/user-attachments/assets/64fae013-f049-45ab-9c59-2ec97aea95a5)

- **Customize Control Group**: Chọn ID login của tài khoản bạn đang sử dụng.
![image](https://github.com/user-attachments/assets/1b8b6152-7042-4057-9357-c9943145d4a7)

**Thiết lập domain**:
- **Back-to-Origin IP/Domain**: Chọn **Own Origin**
  1.Nhập tên miền (domain) bạn muốn cấu hình CDN.  
  2.Nhập IP hoặc domain của máy chủ gốc (**Origin Server**).
- **Acceleration Configuration**: Chọn **Custom Setting**.
![image](https://github.com/user-attachments/assets/fbf05e67-7659-4741-a1ec-4cee45eaa3b5)


Sau đó nhấn **Submit** để hoàn tất bước cấu hình.

> ✅ Sau khi cấu hình thành công, bạn có thể:
> - Nhấn **Return to configuration** để quay lại màn hình cấu hình.
> - Hoặc chọn các tùy chọn khác để thêm mới hoặc chỉnh sửa domain hiện tại.
![image](https://github.com/user-attachments/assets/269bfb6c-acef-4aa6-9e5a-2ff567ecf1c5)


#### Bước 5: Kiểm tra trạng thái domain

- Sau khi tạo, trạng thái domain sẽ là **Deploying**.
- Nếu cần triển khai gấp, bạn có thể liên hệ bộ phận kỹ thuật qua email: [support@vinahost.vn](mailto:support@vinahost.vn) để được hỗ trợ.
![image](https://github.com/user-attachments/assets/83eb8b8a-10ca-4d08-8516-cf5a5d5d1a2d)


> 🔄 Khi triển khai hoàn tất, trạng thái sẽ chuyển sang **Enable**.
![image](https://github.com/user-attachments/assets/f3c22088-19dd-497c-a4cc-406faf3f005b)

#### Bước 6: Tạo bản ghi CNAME cho tên miền CDN

- Truy cập hệ thống quản lý DNS và tạo **bản ghi CNAME** cho domain CDN theo giá trị ở ảnh trên.
- Nếu bạn đã đăng ký tên miền tại Vinahost, có thể tham khảo hướng dẫn chi tiết tại:
  [https://blog.vinahost.vn/huong-dan-su-dung-dns-manager-va-quan-ly-ten-mien-tai-vinahost/](https://blog.vinahost.vn/huong-dan-su-dung-dns-manager-va-quan-ly-ten-mien-tai-vinahost/)
![image](https://github.com/user-attachments/assets/03bd506e-f254-4bd6-a4e4-d8942782be0d)

#### Bước 7: Kiểm tra hoạt động CDN

Truy cập domain đã cấu hình CDN để kiểm tra hoạt động và đảm bảo nội dung được phân phối thông qua CDN.

![image](https://github.com/user-attachments/assets/7b468a81-f458-4bc1-aece-709b2368f939)

## Hướng dẫn cấu hình port trên CDN:
### Cách 1 
Bạn có thể tạo nhanh ở đây 
![image](https://github.com/user-attachments/assets/070b829d-5759-4ac4-bbf9-31b7093c7691)
![image](https://github.com/user-attachments/assets/f8fab0dc-3f67-490e-b61b-e853a4db78f5)

### Cách 2 
#### Bước 1: Vào edit của domain cần cấu hình

![image](https://github.com/user-attachments/assets/f77bb513-fca0-43fa-983e-f519064c3ca9)


#### Bước 2: Cấu hình yêu cầu CDN sử dụng HTTPs đến Orgin Server
Vì mặt định các CDN sẽ gửi yêu cầu đến Origin bằng giao thức của client.  
Nếu người dùng truy cập bằng HTTP thì các Edge sẽ gửi yêu cầu đến Origin bằng HTTP, ta thay đổi để bảo mật hơn.  

![image](https://github.com/user-attachments/assets/3e91ff1b-998a-4605-b0f4-9621703547eb)

![image](https://github.com/user-attachments/assets/ab300629-c41f-4b8a-aafc-ffaf56cd27f3)

![image](https://github.com/user-attachments/assets/4f599ab1-47bf-4bac-954b-97c5a0bee86b)

#### Bước 3: Cấu hình Port cho Origin Server
- Domain sẽ được tự động điền bằng tên domain mà chúng ta edit.
- Back to Origin Request Port: là port ta yêu cầu đến Origin (ở đây mình ví dụ là 443)
- Back to Origin Request Host: là máy chủ Origin ta có thể điền domain hoặc IP
- Redirection Optimization ta chọn 301 
- Sau đó ấn Next 

![image](https://github.com/user-attachments/assets/e777ee00-9104-4eea-846c-f57838187b87)

#### Bước 4: Xem lại cấu hình và chọn Deloy Now
![image](https://github.com/user-attachments/assets/197b3289-ef4c-4f9f-a7f8-08920a795366)



---

> 📝 **Lưu ý:** Hướng dẫn này dành cho khách hàng sử dụng dịch vụ CDN của VINAHOST. Nếu có bất kỳ khó khăn nào, vui lòng liên hệ bộ phận kỹ thuật để được trợ giúp nhanh chóng.


> **THAM KHẢO CÁC DỊCH VỤ TẠI [VINAHOST](https://vinahost.vn/)**
>
> **\>> [SERVER](https://vinahost.vn/thue-may-chu-rieng/) – [COLOCATION](https://vinahost.vn/colocation.html) – [CDN](https://vinahost.vn/dich-vu-cdn-chuyen-nghiep)**
> **\>> [CLOUD](https://vinahost.vn/cloud-server-gia-re/) – [VPS](https://vinahost.vn/vps-ssd-chuyen-nghiep/)**
> **\>> [HOSTING](https://vinahost.vn/wordpress-hosting)**
> **\>> [EMAIL](https://vinahost.vn/email-hosting)**
> **\>> [WEBSITE](http://vinawebsite.vn/)**
> **\>> [TÊN MIỀN](https://vinahost.vn/ten-mien-gia-re/)**
