const { default: axios } = require("axios");

exports.listBanks = async (req, res, next) => {
  try {
    const result = await axios.get(`${process.env.PAYSTACK_API}/bank`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    });
    return res.status(200).json(result.data);
  } catch (error) {
    next(error);
  }
};

exports.resolveAccountNumber = async (req, res, next) => {
  try {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || !bankCode)
      return res
        .status(422)
        .json({ message: "Account number and bank must be selected" });
    const result = await axios.get(
      `${process.env.PAYSTACK_API}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      }
    );
    return res.status(200).json(result.data);
  } catch (error) {
    next(error);
  }
};
