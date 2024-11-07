const mongoose = require('mongoose');
const Account = require('../models/Account');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const TransactionInventory = require('../models/TransactionInventory');
const InvoiceSaleHeader = require('../models/InvoiceSale_Header');
const InvoiceSaleDetail = require('../models/InvoiceSale_Detail');
const Unit = require('../models/Unit');
const Customer = require('../models/Customer');
const promotionService = require('./promotionService');
const Warehouse = require('../models/Warehouse');
const ProductPriceHeader = require('../models/ProductPrice_Header')
const ProductPriceDetail = require('../models/ProductPrice_Detail')
const PromotionDetail = require('../models/Promotion_Detail');
const PromotionLine = require('../models/Promotion_Line');

async function getCartById(accountId) {
    try {
        const cart = await Cart.findOne({ account_id: accountId })
            .populate('products.product_id') // populate sản phẩm trong giỏ hàng
            .populate('products.unit_id') // populate đơn vị sản phẩm
            .populate('products.price');
        if (!cart) {
            throw new Error(`Cart not found for account ID: ${accountId}`);
        }

        const products = cart.products;

        // Lấy thông tin sản phẩm từ product_id
        const productsWithDetails = await Promise.all(products.map(async (product) => {
            const image = product.product_id.unit_convert.find((unit) => unit.unit.equals(product.unit_id._id));
            console.log(product)
            return {
                product_id: product.product_id,
                name: product.product_id.name || null, // lấy tên sản phẩm
                item_code: product.product_id.item_code || null, // lấy mã sản phẩm
                img: image?.img,
                quantity: product.quantity,
                price: product.price,
                unit: product.unit_id,
                total: product.total,
            };
        }));

        return productsWithDetails;
    } catch (err) {
        throw new Error(`Error getting cart: ${err.message}`);
    }
}


async function addProductToCart(accountId, productId, unitId, quantity, total) {
    try {
        console.log(accountId, productId, unitId, quantity, total)
        // Tìm giỏ hàng của người dùng
        let product = await Product.findById(productId)
        console.log(product)
        let cart = await Cart.findOne({ account_id: accountId });
        let priceInfo = await ProductPriceDetail.findOne({
            item_code: product.item_code,
            unit_id: unitId
        }).
            populate({
                path: "productPriceHeader_id",
                match: { status: "active" }, // Only include active ProductPriceHeader
            });
        console.log(priceInfo)
        // Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới
        if (!cart) {
            cart = new Cart({ account_id: accountId, products: [] });
        }

        // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
        const productIndex = cart.products.findIndex(p => p.product_id.toString() === productId && p.unit_id.toString() === unitId);

        if (productIndex > -1) {
            // Nếu sản phẩm đã tồn tại, cập nhật số lượng sản phẩm và giá
            cart.products[productIndex].quantity += quantity;
            cart.products[productIndex].price = priceInfo._id;
            cart.products[productIndex].total = total;
        } else {
            // Nếu sản phẩm chưa tồn tại, thêm sản phẩm mới vào giỏ hàng
            cart.products.push({ product_id: productId, unit_id: unitId, quantity: quantity, price: priceInfo._id, total: total });
        }

        // Lưu giỏ hàng
        await cart.save();

        return cart;
    } catch (err) {
        throw new Error(`Error adding product to cart: ${err.message}`);
    }
}

async function updateCart(accountId, productList) {
    try {
        // Tìm giỏ hàng của người dùng
        let cart = await Cart.findOne({ account_id: accountId });

        // Duyệt qua danh sách sản phẩm và cập nhật giá
        for (let product of productList) {
            // Tìm giá theo product._id từ ProductPriceDetail
            let priceInfo = await ProductPriceDetail.findOne({ product_id: product.product_id }).populate({
                path: "productPriceHeader_id",
                match: { status: "active" }, // Only include active ProductPriceHeader
            });
            if (priceInfo) {
                // Gán lại giá cho sản phẩm
                product.price = priceInfo._id;
            }
        }
        // Cập nhật giỏ hàng
        cart.products = productList;

        // Lưu giỏ hàng
        await cart.save();

        return cart;

    } catch (err) {
        throw new Error(`Error updating cart: ${err.message}`);
    }
}

async function removeAllProductInCart(accountId) {
    try {
        // Tìm giỏ hàng của người dùng
        let cart = await Cart.findOne({ account_id: accountId });

        // Xóa toàn bộ sản phẩm trong giỏ hàng
        cart.products = [];

        // Lưu lại giỏ hàng đã được cập nhật
        await cart.save();

        return { success: true, message: 'All products removed from cart' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function payCart(customerId, products,unit_id, paymentMethod, paymentInfo, paymentAmount) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Tính tổng giá trị của giỏ hàng
        // let totalAmount = amount;
        // for (const item of products) {
        //     const product = await Product.findById(item.product_id).session(session);
        //     if (!product) {
        //         throw new Error(`Product with id ${item.product_id} not found`);
        //     }
        //     totalAmount += product.price * item.quantity;
        // }

        const invoiceSaleHeader = new InvoiceSaleHeader({
            customer_id: customerId,
            paymentInfo: paymentInfo,
            paymentMethod: paymentMethod,
            paymentAmount: paymentAmount,
        });
        await invoiceSaleHeader.save({ session });

        // Cập nhật số lượng sản phẩm trong kho và lưu thông tin
        const invoiceSaleDetails = [];

        for (const product of products) {
            // Lấy thông tin khuyến mãi cho từng sản phẩm
            const promotions = await promotionService.getPromotionByProductId(product.product_id,unit_id); // Thay đổi để lấy theo ID sản phẩm

            const invoiceSaleDetail = {
                product: product.product_id, // ID sản phẩm
                quantity: product.quantity, // Số lượng
                price: product.price, // ID giá sản phẩm
                promotion: promotions.length > 0 ? promotions[0]._id : null // ID khuyến mãi nếu có
            };

            invoiceSaleDetails.push(invoiceSaleDetail);
        }

        // Lưu thông tin hóa đơn bán hàng chi tiết
        const newInvoiceSaleDetail = new InvoiceSaleDetail({
            invoiceSaleHeader_id: invoiceSaleHeader._id,
            products: invoiceSaleDetails,
        });

        await newInvoiceSaleDetail.save({ session });

        for (const item of products) {
            const transactionInventory = new TransactionInventory({
                product_id: item.product_id,
                quantity: item.quantity,
                type: 'Bán hàng',
                order_customer_id: invoiceSaleHeader._id,
            });
            await transactionInventory.save({ session });

        }

        await removeAllProductInCart(customerId);

        for (const product of products) {
            const pro = await Product.findById(product.product_id).session(session);
            const unit = await Unit.findById(pro.unit_id).session(session);
            console.log(pro, unit) // Sử dụng session cho findById
            const conversionFactor = unit.quantity || 1;

            // Tìm warehouse bằng item_code, có session
            const warehouse = await Warehouse.findOne({ item_code: pro.item_code }).session(session);

            // Tính số lượng cần cập nhật (quantity * conversionFactor)
            const quantityToAdd = product.quantity * conversionFactor;

            console.log('Số lượng cập nhật:', quantityToAdd);

            // Cập nhật số lượng trong kho
            console.log(`Trước cập nhật của ${warehouse.item_code}: ${warehouse.stock_quantity}`);
            warehouse.stock_quantity -= quantityToAdd;
            console.log(`Sau cập nhật của ${warehouse.item_code}: ${warehouse.stock_quantity}`);

            await warehouse.save({ session });
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        return { success: true, message: 'Payment successful' };
    } catch (error) {
        // Rollback transaction
        await session.abortTransaction();
        session.endSession();

        return { success: false, message: error.message };
    }
}

async function payCartWeb(employee,customerId, products, paymentMethod, paymentInfo, paymentAmount) {
    console.log(employee);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Conditionally set customer_id only if customerId is not null
        const invoiceSaleHeaderData = {
          
            paymentInfo: paymentInfo,
            paymentMethod: paymentMethod,
            paymentAmount: paymentAmount,
        };
        
        if (employee) {
           
            invoiceSaleHeaderData.employee_id = employee._id;
        }
        if (customerId) {
           
            invoiceSaleHeaderData.customer_id = customerId;
        }

        const invoiceSaleHeader = new InvoiceSaleHeader(invoiceSaleHeaderData);
        await invoiceSaleHeader.save({ session });

        const invoiceSaleDetails = []; // Initialize the array to hold invoice sale details

        for (const product of products) {
        
                const invoiceSaleDetail = {
                    product: product._id, // ID sản phẩm
                    quantity: product.quantity, // Số lượng
                    unit_id:product.price.unit._id,
                    price: product.price.price, // Giá sản phẩm
                    promotion: product.promotion? product.promotion._id : null, // ID khuyến mãi nếu có
                    discountAmount:  product.promotion? product.discountAmount : 0
                };
        
                // Push the detail into the invoice sale details array
                invoiceSaleDetails.push(invoiceSaleDetail);
        }
        const newInvoiceSaleDetail = new InvoiceSaleDetail({
            invoiceSaleHeader_id: invoiceSaleHeader._id,
            products: invoiceSaleDetails,
        });
        await newInvoiceSaleDetail.save({ session });

        for (const item of products) {
            const transactionInventory = new TransactionInventory({
                product_id: item._id,
                unit_id:item.unit._id,
                quantity: item.quantity,
                type: 'Bán hàng',
                order_customer_id: invoiceSaleHeader._id,
            });
            await transactionInventory.save({ session });
        }

        for (const product of products) {
            const pro = await Product.findById(product._id).session(session);
            const unit = await Unit.findById(product.unit._id).session(session);
            console.log('222',pro, unit);
            const conversionFactor = unit.quantity || 1;
            const warehouse = await Warehouse.findOne({
                item_code: pro.item_code,
                unit_id: unit._id
            }).session(session);
            
            const quantityToAdd = product.quantity * conversionFactor;

            console.log('Số lượng cập nhật:', quantityToAdd);
            console.log(`Trước cập nhật của ${warehouse.item_code}: ${warehouse.stock_quantity}`);
            warehouse.stock_quantity -= quantityToAdd;
            console.log(`Sau cập nhật của ${warehouse.item_code}: ${warehouse.stock_quantity}`);
            await warehouse.save({ session });
        }

        // Commit transaction
        await session.commitTransaction();
        session.endSession();

        return { success: true, message: 'Thanh toán thành công' ,data: invoiceSaleHeader};
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: error.message };
    }
}

const getInvoiceById = async (invoiceCode) => {
    try {
        // Find the invoice header by invoiceCode
        const invoice = await InvoiceSaleHeader.findOne({ invoiceCode })
            .populate({
                path: 'customer_id',
                select: 'name phone' // Only retrieve customer name and phone
            })
            .populate({
                path: 'employee_id',
                select: 'name' // Only retrieve employee name
            })
            .populate({
                path: 'paymentInfo.address',
                select: 'city district ward street' // Address details
            });

        if (!invoice) {
            return { message: 'Invoice not found' };
        }

        // Fetch related invoice details, including nested promotion data
        const invoiceDetails = await InvoiceSaleDetail.findOne({ invoiceSaleHeader_id: invoice._id })
            .populate({
                path: 'products.product',
                select: 'name' // Retrieve product name only
            })
            .populate({
                path: 'products.unit_id',
                select: 'unitName' // Retrieve unit name only
            })
            .populate({
                path: 'products.promotion',
                populate: [
                    {
                        path: 'product_id',
                        select: 'name' // Get promotion's related product details
                    },
                    {
                        path: 'product_donate',
                        select: 'name' // Get details of the donated product in promotion
                    },
                    {
                        path:'unit_id',
                        select: 'description' // Get
                    },
                    {
                        path:'unit_id_donate',
                        select: 'description' // Get
                    }
                ]
            });

        return {
            invoice,
            invoiceDetails
        };
    } catch (error) {
        console.error("Error fetching invoice:", error);
        throw new Error("Could not retrieve the invoice. Please try again.");
    }
};



const getInvoiceLast = async () => {
    try {
        const lastInvoice = await InvoiceSaleHeader.findOne().sort({ createdAt: -1 });
        return lastInvoice;
    } catch (error) {
        console.error("Lỗi khi lấy hóa đơn cuối cùng:", error);
        throw error;
    }
};

const removeProductCart = async (accountId, productId) => {
    try {
        // Tìm giỏ hàng của người dùng
        let cart = await Cart.findOne({ account_id: accountId });

        // Xóa sản phẩm trong giỏ hàng
        cart.products = cart.products.filter(p => p.product_id.toString() !== productId);

        // Lưu lại giỏ hàng đã được cập nhật
        await cart.save();

        return { success: true, message: 'Product removed from cart' };
    }
    catch (error) {
        return { success: false, message: error.message };
    }
}
const updateProductCart = async (accountId, productId, unitId, quantity) => {
    try {
        // Tìm giỏ hàng của người dùng
        let cart = await Cart.findOne({ account_id: accountId });

        // Cập nhật số lượng sản phẩm trong giỏ hàng
        const productIndex = cart.products.findIndex(p => p.product_id.toString() === productId && p.unit_id.toString() === unitId);

        if (productIndex > -1) {
            cart.products[productIndex].quantity = quantity;
        }

        // Lưu lại giỏ hàng đã được cập nhật
        await cart.save();

        return { success: true, message: 'Product updated in cart' };

    } catch (error) {
        return { success: false, message: error.message };
    }
}

const updateCustomerInfo = async (accountId, userData) => {
    try {
        const account = await Account.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }

        // Cập nhật thông tin người dùng, không bao gồm trường phone
        const { phone, ...userDataToUpdate } = userData; // Loại bỏ phone ra khỏi userData
        const userUpdated = await Customer.findOneAndUpdate(
            { account_id: accountId },
            { $set: userDataToUpdate },  // Cập nhật thông tin khác
            { new: true }
        );

        return userUpdated;
    } catch (error) {
        throw new Error('Error updating user: ' + error.message);
    }
}

const getInvoicesByAccountId = async (accountId) => {
    try {
        // Tìm tất cả các hóa đơn của tài khoản
        const invoicesHeader = await InvoiceSaleHeader.find({ customer_id: accountId });

        // Lấy chi tiết hóa đơn và thông tin sản phẩm cho mỗi hóa đơn
        const invoices = await Promise.all(invoicesHeader.map(async (header) => {
            // Tìm chi tiết của hóa đơn (là một object, không phải mảng)
            const detail = await InvoiceSaleDetail.findOne({ invoiceSaleHeader_id: header._id }).lean();
            const customer = await Customer.findOne({ account_id: header.customer_id }).select('name').lean();

            // Duyệt qua products bên trong detail
            const productsWithInfo = await Promise.all(detail.products.map(async (item) => {
                const product = await Product.findById(item.product).select('name img unit_id').lean();
                const unit = await Unit.findById(product?.unit_id).select('description').lean();
                const promotionDetail = await PromotionDetail.findOne({ _id: item.promotion }).lean() || {};
                let promotionLine = {};

                // Kiểm tra và xử lý khuyến mãi nếu có
                if (promotionDetail) {
                    promotionLine = await PromotionLine.findOne({ _id: promotionDetail.promotionLine_id }).lean();

                    // Gán promotionDetail vào promotionLine nếu promotionLine tồn tại
                    if (promotionLine) {
                        promotionLine.promotionDetail = promotionDetail;
                    }
                }

                // Tính giá sau khuyến mãi (nếu khuyến mãi là loại "amount")
                let total = 0;
                let discountedPrice = item.price;
                let productBuy = null;
                let productDonate = null;

                if (promotionLine && promotionLine.type === 'amount') {
                    const discountAmount = promotionDetail.amount_donate || 0;
                    const minQuantity = promotionDetail.quantity || 1;
                    if (item.quantity >= minQuantity) {
                        discountedPrice = Math.max(0, item.price - discountAmount);
                        total = item.quantity * discountedPrice;
                    }
                } else if (promotionLine && promotionLine.type === 'quantity') {
                    const minQuantity = promotionDetail.quantity || 1; // Số lượng cần mua
                    const quantityDonate = promotionDetail.quantity_donate || 0; // Số lượng được tặng

                    // Truy vấn thông tin sản phẩm mua và sản phẩm được tặng
                    productBuy = await Product.findOne({ _id: promotionDetail.product_id }).select('name img').populate('unit_id', 'description').lean();
                    productDonate = await Product.findOne({ _id: promotionDetail.product_donate }).select('name img').populate('unit_id', 'description').lean();

                    // Số lượng sản phẩm mà khách hàng cần mua thực tế (không tính số lượng được tặng)
                    const chargeableQuantity = Math.floor(item.quantity / (minQuantity + quantityDonate)) * minQuantity
                        + (item.quantity % (minQuantity + quantityDonate));

                    // Tổng tiền phải trả
                    total = chargeableQuantity * item.price;

                    // Gắn thông tin productBuy và productDonate vào productDetail
                    promotionDetail.productBuy = productBuy;  // Thêm thông tin sản phẩm mua
                    promotionDetail.productDonate = productDonate; // Thêm thông tin sản phẩm tặng
                } else {
                    discountedPrice = 0;
                    total = item.quantity * item.price;
                }

                promotionDetail.discountedPrice = discountedPrice;
                promotionDetail.total = total;

                return {
                    ...item,
                    promotion: promotionLine,
                    total,
                    productName: product ? product.name : 'Unknown',
                    productImg: product ? product.img : null,
                    unitName: unit ? unit.description : 'Unknown'
                };
            }));

            // Trả về thông tin hóa đơn cùng chi tiết và thông tin sản phẩm
            return {
                ...header.toObject(),
                customerName: customer ? customer.name : 'Unknown',
                detail: productsWithInfo
            };
        }));

        return invoices;
    } catch (error) {
        throw new Error('Error getting invoices: ' + error.message);
    }
};

const checkStockQuantityInCart = async (item_code, quantity) => {
    try {
        const warehouse = await Warehouse.findOne({ item_code: item_code });
        if (!warehouse) {
            return { inStock: false, message: `Warehouse with item_code ${item_code} not found` };
        }

        if (warehouse.stock_quantity < quantity) {
            return { inStock: false, message: `Tồn kho không đủ. Số lượng còn lại: ${warehouse.stock_quantity}` };
        }

        return { inStock: true }; // Tồn kho đủ
    } catch (error) {
        throw new Error(`Error checking stock quantity: ${error.message}`);
    }
};
async function getCustomerByPhone(phone) {
    try {
      // Find the customer by phone number
      const customer = await Customer.findOne({ phone });
  
      // Check if customer was found
      if (!customer) {
        throw new Error("Khách hàng chưa được đăng ký");
      }
  
      return customer;
    } catch (error) {
      console.error("Error fetching customer by phone:", error.message);
      throw new Error("Xảy ra lỗi khi tìm thông tin khách hàng"); // Preserve the original error message
    }
  }
  
module.exports = {
    payCartWeb,
    getCartById,
    addProductToCart,
    payCart,
    updateCart,
    removeProductCart,
    updateProductCart,
    updateCustomerInfo,
    getInvoicesByAccountId,
    checkStockQuantityInCart,
    getCustomerByPhone,
    getInvoiceById,
    getInvoiceLast
}

