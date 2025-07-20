"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Smartphone, DollarSign, Loader2, Check } from "lucide-react"

interface PaymentModalProps {
    plan: {
        id: string
        name: string
        price: number
        period: string
    }
    onSuccess: () => void
    onClose: () => void
}

export default function PaymentModal({ plan, onSuccess, onClose }: PaymentModalProps) {
    const [loading, setLoading] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState("stripe")
    const [paymentData, setPaymentData] = useState({
        // Stripe
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardName: "",
        // M-Pesa
        phoneNumber: "",
        // PayPal
        email: "",
    })

    const handlePayment = async () => {
        setLoading(true)

        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 2000))

        console.log(`Processing ${paymentMethod} payment for ${plan.name} plan`)
        console.log("Payment data:", paymentData)

        setLoading(false)
        onSuccess()
    }

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center">Complete Your Subscription</DialogTitle>
                    <div className="text-center space-y-2">
                        <p className="text-lg font-semibold">{plan.name} Plan</p>
                        <p className="text-2xl font-bold text-blue-600">
                            ${plan.price}/{plan.period}
                        </p>
                    </div>
                </DialogHeader>

                <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="stripe" className="flex items-center space-x-1">
                            <CreditCard className="h-4 w-4" />
                            <span>Card</span>
                        </TabsTrigger>
                        <TabsTrigger value="mpesa" className="flex items-center space-x-1">
                            <Smartphone className="h-4 w-4" />
                            <span>M-Pesa</span>
                        </TabsTrigger>
                        <TabsTrigger value="paypal" className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4" />
                            <span>PayPal</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Stripe Payment */}
                    <TabsContent value="stripe" className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="cardName">Cardholder Name</Label>
                                <Input
                                    id="cardName"
                                    placeholder="John Doe"
                                    value={paymentData.cardName}
                                    onChange={(e) => setPaymentData({ ...paymentData, cardName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cardNumber">Card Number</Label>
                                <Input
                                    id="cardNumber"
                                    placeholder="1234 5678 9012 3456"
                                    value={paymentData.cardNumber}
                                    onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="expiryDate">Expiry Date</Label>
                                    <Input
                                        id="expiryDate"
                                        placeholder="MM/YY"
                                        value={paymentData.expiryDate}
                                        onChange={(e) => setPaymentData({ ...paymentData, expiryDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="cvv">CVV</Label>
                                    <Input
                                        id="cvv"
                                        placeholder="123"
                                        value={paymentData.cvv}
                                        onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* M-Pesa Payment */}
                    <TabsContent value="mpesa" className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="phoneNumber">M-Pesa Phone Number</Label>
                                <Input
                                    id="phoneNumber"
                                    placeholder="+254 700 000 000"
                                    value={paymentData.phoneNumber}
                                    onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
                                />
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    You will receive an M-Pesa prompt on your phone to complete the payment.
                                </p>
                            </div>
                        </div>
                    </TabsContent>

                    {/* PayPal Payment */}
                    <TabsContent value="paypal" className="space-y-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="paypalEmail">PayPal Email</Label>
                                <Input
                                    id="paypalEmail"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={paymentData.email}
                                    onChange={(e) => setPaymentData({ ...paymentData, email: e.target.value })}
                                />
                            </div>
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                    You will be redirected to PayPal to complete your payment securely.
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Payment Button */}
                <div className="space-y-4">
                    <Button onClick={handlePayment} disabled={loading} className="w-full">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing Payment...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Pay ${plan.price} Now
                            </>
                        )}
                    </Button>

                    <div className="text-center text-xs text-gray-500">
                        <p>🔒 Your payment information is secure and encrypted</p>
                        <p>30-day money-back guarantee</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
