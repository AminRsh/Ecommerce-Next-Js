import { cookies } from "next/dist/client/components/headers"
import { prisma } from './prisma';
import { Cart, CartItem, Prisma } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export type CartWithProduct = Prisma.CartGetPayload<{
    include: {
        items: {
            include: {
                product: true
            }
        }
    }
}>

export type CartItemWithProduct = Prisma.CartItemGetPayload<{
    include: { product: true }
}>


export type ShoppingCart = CartWithProduct & {
    size: number,
    subtotal: number
}

export async function createCart(): Promise<ShoppingCart> {

    const session = await getServerSession(authOptions)

    let newCard: Cart

    if (session) {
        newCard = await prisma.cart.create({
            data: {
                userId: session.user.id
            }
        })
    } else {
        newCard = await prisma.cart.create({
            data: {}
        })
        //Note: Need encryption + secure settings in real production app
        cookies().set("localCardId", newCard.id)
    }

    return {
        ...newCard,
        items: [],
        size: 0,
        subtotal: 0
    }
}

export async function getCart(): Promise<ShoppingCart | null> {

    const session = await getServerSession(authOptions)

    let cart: CartWithProduct | null = null

    if (session) {
        cart = await prisma.cart.findFirst({
            where: { userId: session.user.id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })
    } else {
        const localCartId = cookies().get("localCardId")?.value
        cart = localCartId ?
            await prisma.cart.findUnique({
                where: {
                    id: localCartId
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            })
            : null
    }


    if (!cart) return null;

    return {
        ...cart,
        size: cart?.items.reduce((acc, item) => acc + item.quantity, 0),
        subtotal: cart?.items.reduce((acc, item) => acc + item.quantity * item.product.price, 0)
    }
}

export async function mergeAnonymousCartIntoUserCart(userId: string) {
    const localCartId = cookies().get("localCardId")?.value

    const localCart = localCartId ?
        await prisma.cart.findUnique({
            where: {
                id: localCartId
            },
            include: {
                items: true
            }
        })
        : null
    if (!localCart) return;

    const userCart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: true }
    })

    await prisma.$transaction(async (tx) => {
        if (userCart) {
            const mergedCartItems = mergeCartItems(localCart.items, userCart.items)

            await tx.cartItem.deleteMany({
                where: { cartId: userCart.id }
            })

            await tx.cart.update({
                where: { id: userCart.id },
                data: {
                    items: {
                        createMany: {
                            data: mergedCartItems.map(item => ({
                                porductId: item.porductId,
                                quantity: item.quantity
                            }))
                        }
                    }
                }
            })

            // await tx.cartItem.createMany({
            //     data: mergedCartItems.map(item => ({
            //         cartId: userCart.id,
            //         porductId: item.porductId,
            //         quantity: item.quantity
            //     }))
            // })
        } else {
            await tx.cart.create({
                data: {
                    userId,
                    items: {
                        createMany: {
                            data: localCart.items.map(item => ({
                                porductId: item.porductId,
                                quantity: item.quantity
                            }))
                        }
                    }
                }
            })
        }

        await tx.cart.delete({
            where: { id: localCart.id }
        })

        cookies().set("localCardId", "")
    })
}

function mergeCartItems(...cartItems: CartItem[][]) {
    console.log('Merging cart items:', cartItems); // Log input cart items

    const mergedItems = cartItems.reduce((acc, items) => {
        console.log('Processing items:', items); // Log each batch of items

        items.forEach((item) => {
            console.log('Processing item:', item); // Log each item being processed

            const existingItem = acc.find((i) => i.porductId === item.porductId); // Check for existing item
            if (existingItem) {
                console.log('Found existing item:', existingItem); // Log if item already exists

                existingItem.quantity += item.quantity; // Merge quantities
            } else {
                console.log('Adding new item:', item); // Log if item is new

                acc.push(item);
            }
        });
        return acc;
    }, [] as CartItem[]);

    console.log('Merged cart items:', mergedItems); // Log final merged items
    return mergedItems;
}
