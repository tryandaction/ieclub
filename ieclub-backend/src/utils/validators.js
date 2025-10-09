// 验证南科大邮箱
exports.validateEmail = (email) => {
  const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS.split(',');
  const emailRegex = new RegExp(`^[^\\s@]+@(${allowedDomains.join('|')})$`);
  return emailRegex.test(email);
};

// 验证密码（至少8位）
exports.validatePassword = (password) => {
  return password && password.length >= 8;
};

// 验证用户名（3-20位）
exports.validateUsername = (username) => {
  return username && username.length >= 3 && username.length <= 20;
};


