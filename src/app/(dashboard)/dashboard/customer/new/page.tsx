'use client'

import React from 'react'
import { useState, ChangeEvent, FormEvent } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { User, Mail, Phone, MapPin } from 'lucide-react'

interface FormData {
    name: string;
    email: string;
    phone: string;
    address: string;
}

interface FormErrors {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
}

export default function CustomerForm() {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        address: ''
    })
    const [errors, setErrors] = useState<FormErrors>({})
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [showSuccess, setShowSuccess] = useState<boolean>(false)
    const [showError, setShowError] = useState<boolean>(false)

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        if (!formData.name || formData.name.length < 2 || formData.name.length > 50) {
            newErrors.name = "Name must be between 2 and 50 characters"
        }

        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address"
        }

        if (!formData.phone || !/^\+?[1-9]\d{9,14}$/.test(formData.phone)) {
            newErrors.phone = "Please enter a valid phone number (10-15 digits)"
        }

        if (!formData.address || formData.address.length < 5 || formData.address.length > 200) {
            newErrors.address = "Address must be between 5 and 200 characters"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setShowSuccess(false)
        setShowError(false)

        if (validateForm()) {
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000))
                setShowSuccess(true)
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    address: ''
                })
            } catch (error) {
                setShowError(true)
            }
        }
        setIsSubmitting(false)
    }

    const handleReset = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: ''
        })
        setErrors({})
    }

    return (
        <Card className="w-full max-w-[750] mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">Create Customer</CardTitle>
                <CardDescription>
                    Enter the customer's information below
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                            <User size={16} className="text-gray-500" />
                            <span>Name</span>
                        </label>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter customer name"
                            className="bg-white"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                            <Mail size={16} className="text-gray-500" />
                            <span>Email</span>
                        </label>
                        <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="customer@example.com"
                            className="bg-white"
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                            <Phone size={16} className="text-gray-500" />
                            <span>Phone</span>
                        </label>
                        <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+1234567890"
                            className="bg-white"
                        />
                        {errors.phone && (
                            <p className="text-sm text-red-500">{errors.phone}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                            <MapPin size={16} className="text-gray-500" />
                            <span>Address</span>
                        </label>
                        <Input
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Enter customer address"
                            className="bg-white"
                        />
                        {errors.address && (
                            <p className="text-sm text-red-500">{errors.address}</p>
                        )}
                    </div>

                    {showSuccess && (
                        <Alert className="bg-green-50">
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>
                                Customer created successfully
                            </AlertDescription>
                        </Alert>
                    )}

                    {showError && (
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                Failed to create customer
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end space-x-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-24"
                            onClick={handleReset}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="w-24"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Create"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
