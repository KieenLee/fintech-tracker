-- Tạo database FintechDB
CREATE DATABASE IF NOT EXISTS FintechDB;
USE FintechDB;

-- Bảng Users - Quản lý Người dùng với thông tin cá nhân đầy đủ
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- **QUAN TRỌNG**: Luôn lưu mật khẩu đã được băm.
    username VARCHAR(50) NOT NULL UNIQUE,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer', -- Thêm role cho người dùng
    first_name VARCHAR(50), -- Tên
    last_name VARCHAR(50), -- Họ
    phone VARCHAR(20), -- Số điện thoại
    date_of_birth DATE, -- Ngày sinh
    address TEXT, -- Địa chỉ
    avatar_url VARCHAR(255), -- URL ảnh đại diện
    telegram_user_id VARCHAR(50) NULL UNIQUE, -- Dùng để liên kết với tài khoản Telegram, có thể NULL.
    is_email_verified BOOLEAN DEFAULT FALSE, -- Trạng thái xác thực email
    is_active BOOLEAN DEFAULT TRUE, -- Trạng thái tài khoản (kích hoạt/vô hiệu hóa)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bảng Accounts - Quản lý các Nguồn tiền
CREATE TABLE Accounts (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_name VARCHAR(100) NOT NULL,
    account_type ENUM('cash', 'bank_account', 'e_wallet', 'credit_card') NOT NULL, -- Giới hạn các loại tài khoản để dữ liệu sạch hơn.
    current_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00, -- **QUAN TRỌNG**: Dùng DECIMAL cho dữ liệu tiền tệ để tránh sai số.
    currency_code CHAR(3) DEFAULT 'VND', -- Mã tiền tệ (VND, USD, v.v.)
    account_color VARCHAR(7), -- Mã màu hex cho tài khoản (dùng trong UI)
    is_active BOOLEAN DEFAULT TRUE, -- Trạng thái tài khoản (kích hoạt/vô hiệu hóa)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE -- Nếu người dùng bị xóa, các tài khoản liên quan cũng sẽ bị xóa.
);

-- Bảng Categories - Quản lý Danh mục Thu/Chi
CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Mỗi người dùng có bộ danh mục riêng.
    parent_category_id INT NULL, -- Dùng để tạo danh mục con (vd: Ăn uống -> Cafe).
    category_name VARCHAR(100) NOT NULL,
    category_icon VARCHAR(50), -- Tên icon hoặc class icon (dùng trong UI)
    category_color VARCHAR(7), -- Mã màu hex cho danh mục (dùng trong UI)
    transaction_type ENUM('expense', 'income') NOT NULL, -- Một danh mục chỉ có thể là THU hoặc CHI.
    is_default BOOLEAN DEFAULT FALSE, -- Danh mục mặc định của hệ thống
    is_active BOOLEAN DEFAULT TRUE, -- Trạng thái danh mục (kích hoạt/vô hiệu hóa)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_category_id) REFERENCES Categories(category_id) ON DELETE SET NULL
);

-- Bảng Transactions - Dữ liệu Giao dịch Cốt lõi
CREATE TABLE Transactions (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY, -- Dùng BIGINT vì số lượng giao dịch có thể rất lớn.
    user_id INT NOT NULL, -- Thêm user_id để tối ưu hóa truy vấn
    account_id INT NOT NULL,
    category_id INT NULL, -- Có thể NULL nếu giao dịch chưa được phân loại.
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type ENUM('expense', 'income', 'transfer') NOT NULL, -- Thêm 'transfer' để xử lý việc chuyển tiền giữa các tài khoản.
    description TEXT,
    transaction_date DATETIME NOT NULL, -- Thời gian thực tế diễn ra giao dịch.
    location VARCHAR(255), -- Vị trí thực hiện giao dịch (dùng trong mobile app)
    latitude DECIMAL(10, 8), -- Vĩ độ
    longitude DECIMAL(11, 8), -- Kinh độ
    receipt_image_url VARCHAR(255), -- URL ảnh hóa đơn (OCR)
    is_recurring BOOLEAN DEFAULT FALSE, -- Giao dịch định kỳ
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (account_id) REFERENCES Accounts(account_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE SET NULL -- Nếu danh mục bị xóa, giao dịch không bị xóa theo.
);

-- Bảng Budgets - Quản lý Ngân sách
CREATE TABLE Budgets (
    budget_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE, -- Ngân sách định kỳ
    notification_threshold DECIMAL(5, 2) DEFAULT 90.00, -- Ngưỡng cảnh báo (%)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category_period (user_id, category_id, start_date, end_date)
);

-- Bảng Goals - Quản lý Mục tiêu tiết kiệm
CREATE TABLE Goals (
    goal_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    target_date DATE NOT NULL,
    description TEXT,
    goal_color VARCHAR(7), -- Mã màu hex cho mục tiêu (dùng trong UI)
    is_active BOOLEAN DEFAULT TRUE, -- Trạng thái mục tiêu
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Bảng Notifications - Quản lý Thông báo
CREATE TABLE Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('budget_warning', 'goal_progress', 'transaction_alert', 'system') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Bảng Logs - Quản lý Nhật ký hoạt động
CREATE TABLE Logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL, -- Hành động (login, create_transaction, update_budget, v.v.)
    table_name VARCHAR(50), -- Tên bảng bị ảnh hưởng
    record_id VARCHAR(50), -- ID của bản ghi bị ảnh hưởng
    old_value TEXT, -- Giá trị cũ (JSON)
    new_value TEXT, -- Giá trị mới (JSON)
    ip_address VARCHAR(45), -- Địa chỉ IP
    user_agent TEXT, -- Thông tin trình duyệt/người dùng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL
);

-- Tạo các chỉ mục để tối ưu hiệu suất truy vấn
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_telegram ON Users(telegram_user_id);
CREATE INDEX idx_accounts_user ON Accounts(user_id);
CREATE INDEX idx_categories_user ON Categories(user_id);
CREATE INDEX idx_transactions_user ON Transactions(user_id);
CREATE INDEX idx_transactions_account ON Transactions(account_id);
CREATE INDEX idx_transactions_category ON Transactions(category_id);
CREATE INDEX idx_transactions_date ON Transactions(transaction_date);
CREATE INDEX idx_budgets_user ON Budgets(user_id);
CREATE INDEX idx_goals_user ON Goals(user_id);
CREATE INDEX idx_notifications_user ON Notifications(user_id);
CREATE INDEX idx_logs_user ON Logs(user_id);
CREATE INDEX idx_logs_action ON Logs(action);
CREATE INDEX idx_logs_created_at ON Logs(created_at);

-- Thêm dữ liệu mẫu cho danh mục mặc định
INSERT INTO Categories (user_id, category_name, transaction_type, is_default, is_active) VALUES
(NULL, 'Food & Dining', 'expense', TRUE, TRUE),
(NULL, 'Transportation', 'expense', TRUE, TRUE),
(NULL, 'Shopping', 'expense', TRUE, TRUE),
(NULL, 'Entertainment', 'expense', TRUE, TRUE),
(NULL, 'Bills & Utilities', 'expense', TRUE, TRUE),
(NULL, 'Healthcare', 'expense', TRUE, TRUE),
(NULL, 'Education', 'expense', TRUE, TRUE),
(NULL, 'Travel', 'expense', TRUE, TRUE),
(NULL, 'Salary', 'income', TRUE, TRUE),
(NULL, 'Freelancing', 'income', TRUE, TRUE),
(NULL, 'Business', 'income', TRUE, TRUE),
(NULL, 'Investment', 'income', TRUE, TRUE),
(NULL, 'Gift', 'income', TRUE, TRUE),
(NULL, 'Other', 'expense', TRUE, TRUE),
(NULL, 'Other', 'income', TRUE, TRUE);