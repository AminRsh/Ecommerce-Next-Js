"use server"

import { createCart, getCart } from "@/lib/db/cart"
import { prisma } from "@/lib/db/prisma"
import { create } from 'domain';
import { revalidatePath } from "next/cache"

export async function incrementProductQuantity(porductId: string)  {
    const cart = await getCart() ?? await createCart()

    const articleInCart = cart.items.find(item => item.porductId === porductId)

    if (articleInCart) {
        await prisma.cart.update({
            where: { id: cart.id },
            data: {
                items: {
                    update: {
                        where: { id: articleInCart.id},
                        data: { quantity: { increment: 1}}
                    }
                }
            }
        })

        // await prisma.cartItem.update({
        //     where: { id: articleInCart.id},
        //     data: { quantity: { increment: 1}}
        // })
    } else {

        await prisma.cart.update({
            where: { id: cart.id },
            data: {
                items: {
                    create: {
                        porductId,
                        quantity: 1
                    }
                }
            }
        })
        // await prisma.cartItem.create({
        //     data : { 
        //         cartId : cart.id,
        //         porductId,
        //         quantity: 1
        //     }
        // })
    }

    revalidatePath("/products/[id]")
}  