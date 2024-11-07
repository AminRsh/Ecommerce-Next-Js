"use client"

import { CartItemWithProduct } from "@/lib/db/cart"
import { formatPrice } from "@/lib/format"
import Image from "next/image"
import Link from "next/link"
import { setProductQuantity } from "./actions"

interface CartEntryProps {
    cartItem: CartItemWithProduct
}

const quantityOptions: JSX.Element[] = []

for (let i = 1; i <=99; i++) {
    quantityOptions.push(
        <option key={i} value={i}>{i}</option>
    )
}


export default function CartEntry({ cartItem: { product, quantity } }: CartEntryProps) {
    return (
        <div className="">
            <div className="flex flex-wrap items-center gap-3">
                <Image
                    src={product?.imageUrl}
                    alt={product?.name}
                    width={200}
                    height={200}
                    className="rounded-lg"
                />
                <div>
                    <Link href={"/products/" + product.id} className="font-bold">{product?.name}</Link>
                <div className="">Price: {formatPrice(product.price)}</div>
                <div className="flex items-center my-1 gap-2">
                    Quantity:
                    <select defaultValue={quantity} 
                    className="w-full max-w-[40px]"
                    onChange={
                        (e) => setProductQuantity(product.id, parseInt(e.currentTarget.value)) 
                    }
                    >
                        <option value={0}>0 (Remove)</option>
                        {quantityOptions}
                    </select>
                </div>
                <div className="flex items-center gap-3">Total: {formatPrice(product.price * quantity)}</div>
                </div>
            </div>
            <div className="divider" />
        </div>
    )
};
