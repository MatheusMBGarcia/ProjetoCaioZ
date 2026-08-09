import { USE_MOCK_DATA } from "../config/dataSource";
import { productsMock } from "./mock/productsMock";
import { productsApi } from "./api/productsApi";

export const productsService = {
  async list() { return USE_MOCK_DATA ? [...productsMock] : productsApi.list(); },
  async get(id) { return USE_MOCK_DATA ? productsMock.find(p => p.id === id) : productsApi.get(id); },
  async create(data) { return USE_MOCK_DATA ? {...data, id:Date.now()} : productsApi.create(data); },
  async update(id,data) { return USE_MOCK_DATA ? {...data,id} : productsApi.update(id,data); },
  async remove(id) { return USE_MOCK_DATA ? true : productsApi.remove(id); }
};