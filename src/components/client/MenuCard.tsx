import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cartStore';

interface MenuCardProps {
  product: Product;
}

export function MenuCard({ product }: MenuCardProps) {
  const { i18n, t } = useTranslation();
  const lang = i18n.language.startsWith('en') ? 'en' : 'fr';

  const { items, addItem, updateQuantity, removeItem } = useCartStore();
  const cartItem = items.find((i) => i.productId === product.id);
  const quantity = cartItem?.quantite ?? 0;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const name = lang === 'en' ? product.nom_en : product.nom_fr;
  const isPopular = product.orderCount > 50;

  function handleAdd() {
    if (quantity === 0) {
      addItem({
        productId: product.id,
        nom_fr: product.nom_fr,
        nom_en: product.nom_en,
        prix: product.prix,
        quantite: 1,
      });
    } else {
      updateQuantity(product.id, quantity + 1);
    }
  }

  function handleDecrement() {
    if (quantity <= 1) {
      removeItem(product.id);
    } else {
      updateQuantity(product.id, quantity - 1);
    }
  }

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Popular badge */}
      {isPopular && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
          {t('menu.popular')}
        </span>
      )}

      {/* Image with placeholder */}
      <div className="relative h-40 w-full overflow-hidden bg-primary/10">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-primary/10" aria-hidden="true" />
        )}
        {!imgError && product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={name}
            loading="lazy"
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
            <ShoppingCart size={32} className="text-primary/40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{name}</h3>
        <p className="mt-auto text-base font-bold text-primary">
          {product.prix.toLocaleString('fr-FR')}&nbsp;{t('menu.cfa')}
        </p>

        {/* Availability */}
        {!product.disponible && (
          <span className="text-xs font-medium text-gray-400">{t('menu.unavailable')}</span>
        )}

        {/* Add / quantity controls */}
        {product.disponible && (
          <div className="mt-1">
            {quantity === 0 ? (
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleAdd}
                aria-label={`${t('menu.add_to_cart')} ${name}`}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              >
                <Plus size={16} />
                {t('menu.add_to_cart')}
              </motion.button>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDecrement}
                  aria-label={`Retirer un ${name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-primary hover:bg-orange-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Minus size={14} />
                </motion.button>
                <span className="w-6 text-center text-sm font-bold text-gray-900">{quantity}</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAdd}
                  aria-label={`Ajouter un ${name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Plus size={14} />
                </motion.button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
