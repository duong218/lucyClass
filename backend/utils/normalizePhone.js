const normalizePhone = (phone = '') => {
  let p = String(phone).replace(/\D/g, '');

  if (p.startsWith('84')) {
    p = '0' + p.slice(2);
  } else if (p.length > 0 && !p.startsWith('0')) {
    p = '0' + p;
  }

  return p;
};

module.exports = normalizePhone;