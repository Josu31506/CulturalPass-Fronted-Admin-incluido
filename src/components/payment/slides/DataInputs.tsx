"use client";
import { PaymentMethod, CreditCardInfo, YapeInfo } from "@src/interfaces/payment/method";
import { UseFormRegister } from "react-hook-form";
import { usePathname } from "next/navigation";
import { enrollEvent } from "@src/services/user/enrollEvent";

export default function DataInputs({ selectedMethod, nextPage, prevPage, creditCardRegister, yapeRegister }: { selectedMethod: PaymentMethod; nextPage: () => void; prevPage: () => void; creditCardRegister: UseFormRegister<CreditCardInfo>; yapeRegister: UseFormRegister<YapeInfo>; }) {

    //get if from the url
    const pathname = usePathname();
    const idEvent = pathname.split("/")[2];

    const handleNextPage = async () => {
        // Here you can handle the form submission logic based on the selected payment method
        //mocked for now
        if (selectedMethod === "credit_card") {
            //const data = creditCardGetValues();
            // Send data to your API
        } else if (selectedMethod === "yape") {
            //const data = yapeGetValues();
            // Send data to your API
        }

        await enrollEvent(idEvent);
        
        nextPage();

    }

    return (
        <div className="w-full">
            {selectedMethod === "credit_card" && (
                <div className="w-9/12 mx-auto">
                    <h2 className="text-2xl font-semibold mb-6">Credit Card Information</h2>
                    <form>
                        <div className="mb-4">
                            <label className="block mb-2">Card Number</label>
                            <input type="text" className="w-10/12 p-2 border border-gray-300 rounded" {...creditCardRegister("cardNumber")} />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2">Expiration Date</label>
                            <input type="text" className="w-10/12 p-2 border border-gray-300 rounded" {...creditCardRegister("expirationDate")} />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2">Security Code</label>
                            <input type="text" className="w-10/12 p-2 border border-gray-300 rounded" {...creditCardRegister("securityCode")} />
                        </div>
                    </form>
                </div>
            )}
            {selectedMethod === "yape" && (
                <div className="w-9/12 mx-auto">
                    <h2 className="text-2xl font-semibold mb-6">Yape Information</h2>
                    <form>
                        <div className="mb-4">
                            <label className="block mb-2">Phone Number</label>
                            <input type="text" className="w-10/12 p-2 border border-gray-300 rounded" {...yapeRegister("phoneNumber")} />
                        </div>
                        <div className="mb-4">
                            <label className="block mb-2">OTP Code</label>
                            <input type="text" className="w-10/12 p-2 border border-gray-300 rounded" {...yapeRegister("otpCode")} />
                        </div>
                    </form>
                </div>
            )}
            <div className="flex flex-row w-10/12 mx-auto justify-between">
                <button onClick={prevPage} className="border-background border cursor-pointer py-3 px-6 rounded-2xl  font-bold text-white bg-background-secondary/80 hover:bg-background-secondary/70 transition-all duration-100">Back</button>
                <button onClick={handleNextPage} className="border-background border cursor-pointer py-3 px-6 rounded-2xl  font-bold text-white bg-background-secondary/80 hover:bg-background-secondary/70 transition-all duration-100">Next</button>
            </div>
        </div>
    );
}