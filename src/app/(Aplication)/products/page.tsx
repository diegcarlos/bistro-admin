"use client";
import { ProductForm } from "@/components/product-form";
import { ProductsGrid } from "@/components/products-grid";
import { Categoria } from "@/components/products-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";
import { Product, ProductFormValues } from "@/schemas/product-schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { useState } from "react";

export default function Page() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const local = localStorage.getItem("user");
  const cnpj = JSON.parse(local || "");
  const { data, isLoading, error } = useQuery<AxiosResponse<Categoria[]>>({
    queryKey: ["products"],
    queryFn: () => {
      const response = api.get(
        `/restaurantCnpj/${cnpj.restaurantCnpj}/categorias`
      );
      return response;
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (formData: ProductFormValues & { file?: File }) => {
      // Criar FormData para upload de imagem
      const productData = new FormData();
      productData.append("nome", formData.nome);
      productData.append("descricao", formData.descricao);
      productData.append("preco", formData.preco.replace(",", "."));
      productData.append("categoriaId", formData.categoriaId);
      productData.append("restaurantCnpj", cnpj.restaurantCnpj);

      if (formData.imagem) {
        productData.append("file", formData.imagem);
      }

      // Endpoint para criar produto
      const endpoint = `/produtos`;
      return api.post(endpoint, productData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      console.error("Erro ao adicionar produto:", error);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (
      formData: ProductFormValues & { id: string; file?: File }
    ) => {
      // Criar FormData para upload de imagem
      const productData = new FormData();
      productData.append("nome", formData.nome);
      productData.append("descricao", formData.descricao);
      productData.append("preco", formData.preco.replace(",", "."));
      productData.append("categoriaId", formData.categoriaId);
      productData.append("restaurantCnpj", cnpj.restaurantCnpj);

      if (formData.imagem) {
        productData.append("file", formData.imagem);
      }

      // Endpoint para atualizar produto
      const endpoint = `/produtos/${formData.id}`;
      return api.put(endpoint, productData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setIsDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      console.error("Erro ao atualizar produto:", error);
    },
  });

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleSubmit = (data: ProductFormValues) => {
    if (editingProduct) {
      updateProductMutation.mutate({ ...data, id: editingProduct.id });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleDeleteProduct = (product: Product) => {};

  if (error) {
    return <div>Error loading products</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <Button onClick={handleAddNewProduct}>Adicionar Produto</Button>
      </div>

      <ProductsGrid
        loading={isLoading}
        items={data?.data || []}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDeleteProduct}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="md:min-w-2xl max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Adicionar Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Edite os detalhes do produto selecionado."
                : "Preencha os detalhes para adicionar um novo produto."}
            </DialogDescription>
          </DialogHeader>

          <ProductForm
            categories={data?.data || []}
            onSubmit={handleSubmit}
            product={editingProduct || undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
