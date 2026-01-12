import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            {/* Container Principal: Ocupa a tela toda e centraliza o conteúdo */}
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFC] p-6 dark:bg-[#0a0a0a]">
                
                {/* O Quadrado (Card) em volta dos botões */}
                <div className="w-full max-w-sm rounded-xl border border-[#19140015] bg-white p-8 shadow-sm dark:border-[#3E3E3A] dark:bg-[#161615]">
                    
                    <div className="flex flex-col gap-4 text-center">
                        <h1 className="mb-2 text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
                            Bem-vindo
                        </h1>

                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-block rounded-lg bg-[#1b1b18] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#333] dark:bg-[#EDEDEC] dark:text-[#0a0a0a] dark:hover:bg-[#d1d1d1]"
                            >
                                Acessar Dashboard
                            </Link>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <Link
                                    href={login()}
                                    className="inline-block rounded-lg bg-[#1b1b18] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#333] dark:bg-[#EDEDEC] dark:text-[#0a0a0a] dark:hover:bg-[#d1d1d1]"
                                >
                                    Log in
                                </Link>

                                {canRegister && (
                                    <Link
                                        href={register()}
                                        className="inline-block rounded-lg border border-[#19140035] px-5 py-3 text-sm font-medium text-[#1b1b18] transition hover:bg-[#f8f8f8] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:bg-[#ffffff05]"
                                    >
                                        Register
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}