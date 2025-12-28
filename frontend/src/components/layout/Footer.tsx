export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
                            LMS
                        </span>
                        <p className="mt-2 text-sm text-gray-500">
                            Empowering knowledge through seamless library management.
                        </p>
                    </div>
                    <div className="flex space-x-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-primary-600 transition-colors">Contact</a>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
                    © {new Date().getFullYear()} Library Management System. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
