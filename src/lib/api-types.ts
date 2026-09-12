export type UserDto = {
  id: number;
  name: string;
  email: string;
  role: "OWNER";
};

export type CategoryDto = {
  id: number;
  name: string;
  isActive: boolean;
  displayOrder: number;
  productCount: number;
};

export type ProductDto = {
  id: number;
  name: string;
  sellingPrice: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  categoryId: number;
  categoryName: string;
};

export type PriceHistoryDto = {
  id: number;
  oldPrice: number;
  newPrice: number;
  createdAt: string;
  changedBy: { id: number; name: string };
};

export type DisplayDeviceDto = {
  id: number;
  name: string;
  isActive: boolean;
  showAllCategories: boolean;
  categoryIds: number[];
  categories: { id: number; name: string }[];
  lastSeenAt: string | null;
  createdAt: string;
};

export type RegisteredDisplayDto = {
  device: DisplayDeviceDto;
  token: string;
  displayUrl: string;
};

export type DisplayPricesDto = {
  updated_at: string | null;
  categories: {
    id: number;
    name: string;
    products: { id: number; name: string; price: number }[];
  }[];
};