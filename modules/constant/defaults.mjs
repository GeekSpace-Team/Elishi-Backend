export const defaultProductImage = (product_id) => ({
  id: 200000,
  small_image: "public/uploads/product/no-image.webp",
  large_image: "public/uploads/product/no-image.webp",
  product_id: product_id,
  is_first: true,
  created_at: "2023-07-09T13:02:37.820249+00:00",
  updated_at: "2023-07-09T13:02:37.820249+00:00",
});

export function addDefaultImage(products) {
  try {
    return products.map((index, product) => {
      console.log(product.images);
      if (
        !product.images ||
        typeof product.images === "undefined" ||
        product.images == null ||
        product.images.lenght <= 0
      ) {
        console.log("Worked");
        product.images = [defaultProductImage(product.id)];
      }
      return product;
    });
  } catch (err) {
    return products;
  }
}
