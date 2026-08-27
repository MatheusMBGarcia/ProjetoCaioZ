import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { usersService } from "../services/usersService";

export function useUsers() {
  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [busy, setBusy] =
    useState(false);

  const [error, setError] =
    useState("");

  const load =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const data =
            await usersService.list();

          setUsers(data);
        } catch (err) {
          console.error(err);

          setError(
            "Não foi possível carregar os usuários."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  const createUser =
    async (data) => {
      setBusy(true);
      setError("");

      try {
        const user =
          await usersService.create(
            data
          );

        await load();

        return user;
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Não foi possível cadastrar o usuário."
        );

        throw err;
      } finally {
        setBusy(false);
      }
    };

  const updateUser =
    async (
      id,
      data
    ) => {
      setBusy(true);
      setError("");

      try {
        const user =
          await usersService.update(
            id,
            data
          );

        await load();

        return user;
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Não foi possível atualizar o usuário."
        );

        throw err;
      } finally {
        setBusy(false);
      }
    };

  const removeUser =
    async (id, requesterId) => {
      setBusy(true);
      setError("");

      try {
        await usersService.remove(
          id,
          requesterId
        );

        await load();

        return true;
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
            "Não foi possível excluir o usuário."
        );

        throw err;
      } finally {
        setBusy(false);
      }
    };

  useEffect(() => {
    load();
  }, [load]);

  return {
    users,

    loading,
    busy,
    error,

    reload: load,

    createUser,
    updateUser,
    removeUser,
  };
}