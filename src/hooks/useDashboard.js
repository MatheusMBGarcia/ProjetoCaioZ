import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { productsService } from "../services/productsService";
import { movementsService } from "../services/movementsService";

export function useDashboard() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        productsData,
        movementsData,
      ] = await Promise.all([
        productsService.list(),
        movementsService.list(),
      ]);

      setProducts(productsData);
      setMovements(movementsData);
    } catch (err) {
      console.error(err);

      setError(
        "Não foi possível carregar o dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | INDICADORES
  |--------------------------------------------------------------------------
  */

  const stats = useMemo(() => {
    const totalProducts =
      products.length;

    const lowStock =
      products.filter(
        (product) =>
          Number(product.stock) > 0 &&
          Number(product.stock) <=
            Number(product.minimum)
      ).length;

    const outOfStock =
      products.filter(
        (product) =>
          Number(product.stock) === 0
      ).length;

    const stockValue =
      products.reduce(
        (total, product) => {
          const stock =
            Number(product.stock || 0);

          const cost =
            Number(product.cost || 0);

          return (
            total +
            stock * cost
          );
        },
        0
      );

    return {
      totalProducts,
      lowStock,
      outOfStock,
      stockValue,
    };
  }, [products]);

  /*
  |--------------------------------------------------------------------------
  | PRODUTOS COM ESTOQUE BAIXO
  |--------------------------------------------------------------------------
  */

  const lowStockProducts =
    useMemo(() => {
      return products
        .filter(
          (product) =>
            Number(product.stock) > 0 &&
            Number(product.stock) <=
              Number(product.minimum)
        )
        .sort(
          (a, b) =>
            Number(a.stock) -
            Number(b.stock)
        )
        .slice(0, 5);
    }, [products]);

  /*
  |--------------------------------------------------------------------------
  | MOVIMENTAÇÕES DOS ÚLTIMOS 6 MESES
  |--------------------------------------------------------------------------
  */

  const movementData =
    useMemo(() => {
      const now = new Date();

      const months = [];

      for (
        let index = 5;
        index >= 0;
        index--
      ) {
        const date =
          new Date(
            now.getFullYear(),
            now.getMonth() -
              index,
            1
          );

        const year =
          date.getFullYear();

        const monthNumber =
          String(
            date.getMonth() + 1
          ).padStart(2, "0");

        const key =
          `${year}-${monthNumber}`;

        let label =
          new Intl.DateTimeFormat(
            "pt-BR",
            {
              month: "short",
            }
          )
            .format(date)
            .replace(".", "");

        label =
          label
            .charAt(0)
            .toUpperCase() +
          label.slice(1);

        months.push({
          key,
          month: label,
          entries: 0,
          exits: 0,
        });
      }

      movements.forEach(
        (movement) => {
          const date =
            movement.movementDate ||
            movement.createdAt;

          if (!date) {
            return;
          }

          const key =
            String(date).slice(
              0,
              7
            );

          const month =
            months.find(
              (item) =>
                item.key === key
            );

          if (!month) {
            return;
          }

          const quantity =
            Number(
              movement.quantity ||
                0
            );

          if (
            movement.type ===
            "ENTRADA"
          ) {
            month.entries +=
              quantity;
          }

          if (
            movement.type ===
            "SAIDA"
          ) {
            month.exits +=
              quantity;
          }
        }
      );

      return months.map(
        ({
          key,
          ...month
        }) => month
      );
    }, [movements]);

  /*
  |--------------------------------------------------------------------------
  | PRODUTOS MAIS RETIRADOS / DISTRIBUÍDOS
  |--------------------------------------------------------------------------
  */

  const topDistributed =
    useMemo(() => {
      const ranking =
        new Map();

      movements
        .filter(
          (movement) =>
            movement.type ===
            "SAIDA"
        )
        .forEach(
          (movement) => {
            const key =
              movement.productId ||
              movement.productSku ||
              movement.productName;

            if (
              !ranking.has(key)
            ) {
              ranking.set(key, {
                productId:
                  movement.productId,

                productName:
                  movement.productName,

                productSku:
                  movement.productSku,

                unit:
                  movement.unit ||
                  "un",

                quantity: 0,
              });
            }

            const item =
              ranking.get(key);

            item.quantity +=
              Number(
                movement.quantity ||
                  0
              );
          }
        );

      return Array.from(
        ranking.values()
      )
        .sort(
          (a, b) =>
            b.quantity -
            a.quantity
        )
        .slice(0, 4);
    }, [movements]);

  /*
  |--------------------------------------------------------------------------
  | MOVIMENTAÇÕES RECENTES
  |--------------------------------------------------------------------------
  */

  const recentMovements =
    useMemo(() => {
      return movements.slice(
        0,
        5
      );
    }, [movements]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    products,
    movements,

    stats,
    lowStockProducts,
    movementData,
    topDistributed,
    recentMovements,

    loading,
    error,

    reload: load,
  };
}