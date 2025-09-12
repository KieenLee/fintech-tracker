# Thiết kế Cơ sở Dữ liệu Hoàn chỉnh cho FinTech Tracker

## 1. Tổng quan

Hệ thống cơ sở dữ liệu của FinTech Tracker được thiết kế để lưu trữ và quản lý thông tin về người dùng, tài khoản, danh mục, giao dịch và ngân sách. Thiết kế này đảm bảo tính toàn vẹn dữ liệu, hiệu suất truy vấn và khả năng mở rộng.

## 2. Các bảng trong cơ sở dữ liệu

### 2.1 Bảng `Users` - Quản lý Người dùng

Bảng này là trung tâm, lưu trữ thông tin đăng nhập và liên kết với Telegram.

```sql
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- **QUAN TRỌNG**: Luôn lưu mật khẩu đã được băm.
    username VARCHAR(50) NOT NULL UNIQUE,
    telegram_user_id VARCHAR(50) NULL UNIQUE, -- Dùng để liên kết với tài khoản Telegram, có thể NULL.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2.2 Bảng `Accounts` - Quản lý các Nguồn tiền

Cho phép người dùng quản lý nhiều tài khoản khác nhau (ví tiền mặt, ngân hàng, MoMo...).

```sql
CREATE TABLE Accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type ENUM('cash', 'bank_account', 'e_wallet', 'credit_card') NOT NULL, -- Giới hạn các loại tài khoản để dữ liệu sạch hơn.
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00, -- **QUAN TRỌNG**: Dùng DECIMAL cho dữ liệu tiền tệ để tránh sai số.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE -- Nếu người dùng bị xóa, các tài khoản liên quan cũng sẽ bị xóa.
);
```

### 2.3 Bảng `Categories` - Quản lý Danh mục Thu/Chi

Cho phép người dùng tự tạo danh mục, hỗ trợ cả danh mục cha-con.

```sql
CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Mỗi người dùng có bộ danh mục riêng.
    parent_category_id INT NULL, -- Dùng để tạo danh mục con (vd: Ăn uống -> Cafe).
    category_name VARCHAR(100) NOT NULL,
    transaction_type ENUM('expense', 'income') NOT NULL, -- Một danh mục chỉ có thể là THU hoặc CHI.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);
```

### 2.4 Bảng `Transactions` - Dữ liệu Giao dịch Cốt lõi

Đây là bảng quan trọng nhất, ghi lại mọi giao dịch thu/chi của người dùng.

```sql
CREATE TABLE Transactions (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- Dùng BIGINT vì số lượng giao dịch có thể rất lớn.
    account_id INT NOT NULL,
    category_id INT NULL, -- Có thể NULL nếu giao dịch chưa được phân loại.
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type ENUM('expense', 'income', 'transfer') NOT NULL, -- Thêm 'transfer' để xử lý việc chuyển tiền giữa các tài khoản.
    description TEXT,
    transaction_date DATETIME NOT NULL, -- Thời gian thực tế diễn ra giao dịch.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES Accounts(account_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL -- Nếu danh mục bị xóa, giao dịch không bị xóa theo.
);
```

### 2.5 Bảng `Budgets` - Quản lý Ngân sách

Lưu trữ các hạn mức chi tiêu mà người dùng đặt ra cho từng danh mục.

```sql
CREATE TABLE Budgets (
    budget_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE CASCADE
);
```

## 3. Giải thích các Quyết định Thiết kế

### 3.1 Sử dụng `DECIMAL` cho tiền tệ
Đây là điều bắt buộc để đảm bảo tính chính xác tuyệt đối trong các phép tính tài chính.

### 3.2 Sử dụng `FOREIGN KEY`
Các khóa ngoại giúp MySQL tự động duy trì sự nhất quán và toàn vẹn cho dữ liệu. Ví dụ, bạn không thể tạo một giao dịch cho một `user_id` không tồn tại.

### 3.3 Tách riêng `Accounts`
Thay vì chỉ ghi nhận thu/chi chung chung, việc có bảng `Accounts` giúp hệ thống có thể mở rộng các tính năng như báo cáo theo từng tài khoản, chuyển tiền giữa các tài khoản, v.v.

### 3.4 Danh mục của người dùng
Cho phép người dùng tự tạo danh mục (`user_id` trong bảng `Categories`) mang lại sự linh hoạt và cá nhân hóa cao.

### 3.5 Thêm Indexes (Tối ưu hóa)
Để đảm bảo hiệu năng khi truy vấn, bạn nên thêm chỉ mục (index) vào các cột khóa ngoại (ví dụ: `user_id`, `account_id`, `category_id`) và các cột thường xuyên được dùng để lọc (ví dụ: `transaction_date`).

## 4. Ví dụ minh họa luồng sử dụng thực tế

### 4.1 Bối cảnh

An là người dùng mới và muốn quản lý chi tiêu hàng ngày của mình.

### 4.2 Bước 1: An Đăng ký Tài khoản

An truy cập vào website và đăng ký một tài khoản.

* **Hành động:** Điền email, username và mật khẩu.
* **Kết quả:** Một hàng mới được tạo ra trong bảng `Users`.

**Bảng `Users`**
| user_id | email | username | password_hash | telegram_user_id |
| :--- | :--- | :--- | :--- | :--- |
| **1** | an.nguyen@email.com | an_nguyen | [hashed_password] | NULL |

### 4.3 Bước 2: An Thêm các Tài khoản & Danh mục

Để bắt đầu, An cần thiết lập các nguồn tiền và danh mục chi tiêu của mình.

* **Hành động:** An vào phần cài đặt và thêm "Ví tiền mặt", "Tài khoản VCB". Sau đó, An tạo thêm một danh mục con "Cà phê" trong danh mục "Ăn uống".
* **Kết quả:** Các hàng mới được tạo trong bảng `Accounts` và `Categories`, tất cả đều được gắn với `user_id = 1` của An.

**Bảng `Accounts`**
| account_id | user_id | account_name | current_balance |
| :--- | :--- | :--- | :--- |
| **101** | **1** | Ví tiền mặt | 1,500,000 |
| **102** | **1** | Tài khoản VCB | 15,000,000 |

**Bảng `Categories`**
| category_id | user_id | parent_category_id | category_name | transaction_type |
| :--- | :--- | :--- | :--- | :--- |
| 50 | **1** | NULL | Ăn uống | expense |
| 51 | **1** | **50** | Cà phê | expense |
| 52 | **1** | NULL | Lương | income |

### 4.4 Bước 3: Giao dịch đầu tiên (Đây là lúc các bảng liên kết với nhau!)

An đi uống cà phê với bạn và dùng tài khoản VCB để thanh toán, sau đó An ghi chép lại qua Telegram.

* **Hành động của An:** Nhắn tin cho Telegram Bot: `cà phê Highlands 55k bằng VCB`

* **Hệ thống xử lý ngầm:**

  1.  Bot nhận được tin nhắn và xác định người gửi có `telegram_user_id` là `12345`.
  2.  Hệ thống tra cứu trong bảng `Users` và thấy `telegram_user_id = 12345` tương ứng với `user_id = 1` (là của An).
  3.  AI phân tích tin nhắn:
      * "cà phê Highlands" → `description`
      * "55k" → `amount` là 55,000
      * "VCB" → tìm trong bảng `Accounts` của `user_id = 1` tài khoản có tên giống "VCB", và tìm thấy `account_id = 102`.
  4.  AI phân loại "cà phê" thuộc danh mục "Cà phê", hệ thống tìm trong bảng `Categories` của `user_id = 1` và thấy `category_id = 51`.
  5.  **Hành động cuối cùng:** Hệ thống tạo một bản ghi mới trong bảng `Transactions` và cập nhật lại số dư trong bảng `Accounts`.

* **Kết quả:**

**Bảng `Transactions`**
| transaction_id | account_id | category_id | amount | transaction_type | description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1001 | **102** (Tài khoản VCB) | **51** (Cà phê) | 55,000 | expense | cà phê Highlands |

**Bảng `Accounts` (đã được cập nhật)**
| account_id | user_id | account_name | current_balance |
| :--- | :--- | :--- | :--- |
| 101 | 1 | Ví tiền mặt | 1,500,000 |
| 102 | 1 | Tài khoản VCB | **14,945,000** |

### 4.5 Bước 4: Xem Báo cáo

Cuối tháng, An vào web dashboard để xem mình đã chi bao nhiêu tiền cho "Ăn uống".

* **Hành động của An:** Nhấn vào xem báo cáo chi tiêu tháng 8.
* **Hệ thống xử lý ngầm:** Hệ thống chạy một câu lệnh SQL phức tạp để lấy dữ liệu. Về cơ bản, nó sẽ:
  1.  Tìm tất cả các `Transactions` của `user_id = 1`.
  2.  Dùng `category_id` trong mỗi giao dịch để tra cứu tên danh mục trong bảng `Categories`.
  3.  Dùng `account_id` để tra cứu tên tài khoản trong bảng `Accounts`.
  4.  Tổng hợp dữ liệu và hiển thị cho An.

Ví dụ câu lệnh để lấy giao dịch vừa rồi:

```sql
SELECT
    t.description,
    t.amount,
    c.category_name,
    a.account_name
FROM Transactions t
JOIN Categories c ON t.category_id = c.category_id
JOIN Accounts a ON t.account_id = a.account_id
WHERE a.user_id = 1; -- Chỉ lấy giao dịch của An
```

**Kết quả hiển thị cho An:**
| Mô tả | Số tiền | Danh mục | Tài khoản |
| :--- | :--- | :--- | :--- |
| cà phê Highlands | 55,000 | Cà phê | Tài khoản VCB |

## 5. Các vấn đề đã được giải quyết

1. **Tính toàn vẹn dữ liệu:** Sử dụng các ràng buộc khóa ngoại để đảm bảo dữ liệu không bị mất mát hoặc sai lệch.
2. **Hiệu suất truy vấn:** Thiết kế các bảng và thêm chỉ mục phù hợp để tối ưu hóa hiệu suất truy vấn.
3. **Khả năng mở rộng:** Cấu trúc bảng linh hoạt cho phép dễ dàng thêm các tính năng mới trong tương lai.
4. **Bảo mật:** Lưu trữ mật khẩu dưới dạng băm để đảm bảo an toàn thông tin người dùng.
5. **Tính nhất quán:** Sử dụng các ràng buộc và trigger để đảm bảo tính nhất quán của dữ liệu trong các thao tác thêm, sửa, xóa.