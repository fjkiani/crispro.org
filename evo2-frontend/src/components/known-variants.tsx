"use client"

import { analyzeVariantWithAPI, type ClinvarVariant, type GeneFromSearch } from "~/utils/genome-api"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { BarChart2, ExternalLink, RefreshCw, Search, Shield, ShoppingCart, Zap } from "lucide-react";
import { getClassificationColorClasses } from "~/utils/coloring-utils";
import type { CartItem } from "~/utils/panel-api";

export default function KnownVariants({
    refreshVariants,
    showComparison,
    updateClinvarVariant,
    clinvarVariants,
    isLoadingClinvar,
    clinvarError,
    genomeId,
    gene,
    onAddToCart,
    isInCart,
} : {
    refreshVariants: () => void;
    showComparison: (variant: ClinvarVariant) => void;
    updateClinvarVariant: (id: string, newVariant: ClinvarVariant) => void;
    clinvarVariants: ClinvarVariant[];
    isLoadingClinvar: boolean;
    clinvarError: string | null;
    genomeId: string;
    gene: GeneFromSearch;
    onAddToCart: (item: CartItem) => void;
    isInCart: (clinvar_id: string) => boolean;
}) {

    // Only show single nucleotide variants
    const snvVariants = clinvarVariants.filter((v) =>
        v.variation_type.toLowerCase().includes("single nucleotide")
    );

    const analyzeVariant = async (variant: ClinvarVariant) => {
        let variantDetails = null
        const position = variant.location ? parseInt(variant.location.replaceAll(",", "")) : null
        const refAltMatch = variant.title.match(/(\w)>(\w)/)

        if (refAltMatch && refAltMatch.length === 3) {
            variantDetails = {
                position,
                reference: refAltMatch[1],
                alternative: refAltMatch[2],
            }
        }

        if (!variantDetails || !variantDetails.position || !variantDetails.reference || !variantDetails.alternative) {
            return
        }

        updateClinvarVariant(variant.clinvar_id, {
            ...variant,
            isAnalyzing: true
        })

        try {
            const data = await analyzeVariantWithAPI({
                position: variantDetails.position,
                alternative: variantDetails.alternative,
                genomeID: genomeId,
                chromosome: gene.chrom
            })

            const updatedVariant: ClinvarVariant = {
                ...variant,
                isAnalyzing: false,
                evo2Result: data
            }

            updateClinvarVariant(variant.clinvar_id, updatedVariant)

            showComparison(updatedVariant)
        } catch (error) {
            updateClinvarVariant(variant.clinvar_id, {
                ...variant,
                isAnalyzing: false,
                evo2error: error instanceof Error ? error.message : "Analysis failed"
            })
        }
    }

    const handleAddToCart = (variant: ClinvarVariant) => {
        const pos = variant.location ? parseInt(variant.location.replaceAll(",", "")) : null;
        const refAltMatch = variant.title.match(/([ATGC])>([ATGC])/);
        if (!pos || !refAltMatch?.[1] || !refAltMatch?.[2]) return;

        onAddToCart({
            clinvar_id: variant.clinvar_id,
            title: variant.title,
            classification: variant.classification,
            gene_symbol: gene.symbol,
            chromosome: variant.chromosome,
            pos,
            ref: refAltMatch[1],
            alt: refAltMatch[2],
            genome: genomeId,
        });
    };

    return (
        <Card className="gap-0 border-none bg-white py-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pt-4 pb-2">
                <CardTitle className="text-sm font-normal test-[#3c4f3d]/70">
                    Known Variants in Gene from ClinVar
                    {!isLoadingClinvar && snvVariants.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-[#3c4f3d]/50">
                            ({snvVariants.length} SNV{snvVariants.length !== 1 ? "s" : ""})
                        </span>
                    )}
                </CardTitle>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshVariants}
                    disabled={isLoadingClinvar}
                    className="h-7 cursor-pointer text-xs text-[#3c4f3d] hover:bg-[#e9eeea]/70"
                >
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Refresh
                </Button>
            </CardHeader>
            <CardContent className="pb-4">
                {clinvarError && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-xs text-red-600">
                        {clinvarError}
                    </div>
                )}

            {isLoadingClinvar ? (
                <div className="flex justify-center py-6">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3c4f3d]/30 border-t-[#3c4f3d]"/>
                </div>
            ) : snvVariants.length > 0 ? (
                <div className="h-96 max-h-96 overflow-y-scroll rounded-md border border-[#3c4f3d]/5">
                    <Table>
                        <TableHeader className="sticky top-0 z-10">
                            <TableRow className="bg-[#e9eeea]/80 hover:bg-[#e9eeea]/30">
                                <TableHead className="py-2 text-xs font-medium text-[#3c4f3d]">
                                    Variant
                                </TableHead>
                                <TableHead className="py-2 text-xs font-medium text-[#3c4f3d]">
                                    Clinical Significance
                                </TableHead>
                                <TableHead className="py-2 text-xs font-medium text-[#3c4f3d]">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {snvVariants.map((variant) => {
                                const inCart = isInCart(variant.clinvar_id);
                                return (
                                <TableRow key={variant.clinvar_id} className="border-b border-[#3c4f3d]/5">
                                    <TableCell className="py-2">
                                        <div className="text-xs font-medium text-[#3c4f3d]">
                                            {variant.title}
                                        </div>
                                        <div className="text-xs mt-1 items-center flex gap-1 font-medium text-[#3c4f3d]/70">
                                            <p>Location: {variant.location}</p>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="h-6 cursor-pointer px-0 text-xs text-[#de8246] hover:text-[#de8246]/80"
                                                onClick={() => window.open(`https://www.ncbi.nlm.nih.gov/clinvar/variation/${variant.clinvar_id}`, "_blank")}
                                            >
                                                View in ClinVar
                                                <ExternalLink className="m1-l inline-block h-2 w-2"/>
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-2 text-xs">
                                       <div className={`w-fit rounded-md px-2 py-2 text-center font-normal ${getClassificationColorClasses(variant.classification)}`}>
                                            {variant.classification || "Unknown"}
                                        </div>
                                        {variant.evo2Result && (
                                            <div className="mt-2">
                                                <div
                                                    className={`flex w-fit items-center gap-1 rounded-md px-2 py-1 text-center ${getClassificationColorClasses(variant.evo2Result.prediction)}`}
                                                >
                                                    <Shield className="h-3 w-3"/>
                                                    <span className="text-center font-normal"
                                                        >Evo2:{" "}{variant.evo2Result.prediction
                                                    }</span>
                                                </div>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-2 text-xs">
                                        <div className="flex flex-col items-end gap-1">
                                            {/* Add to Cart button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={inCart}
                                                onClick={() => handleAddToCart(variant)}
                                                className={`h-7 cursor-pointer px-3 text-xs ${
                                                    inCart
                                                        ? "border-green-200 bg-green-50 text-green-700 opacity-80"
                                                        : "border-[#3c4f3d]/30 text-[#3c4f3d] hover:bg-[#3c4f3d]/10"
                                                }`}
                                            >
                                                <ShoppingCart className="mr-1 inline-block h-3 w-3"/>
                                                {inCart ? "In Cart ✓" : "Add to Cart"}
                                            </Button>

                                            {/* Analyze with Evo2 button */}
                                            {!variant.evo2Result ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 cursor-pointer border-[#3c4f3d]/20 bg-[#e9eeea] px-3 text-xs text--[#3c4f3d] hov34:bg-[#3c4f3d]/10"
                                                    disabled={variant.isAnalyzing}
                                                    onClick={() => analyzeVariant(variant)}
                                                >
                                                    {variant.isAnalyzing ? (
                                                        <>
                                                        <span className="mr-1 inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#3c4f3d]/30 border-t-[#3c4f3d]"></span>
                                                        Analyzing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Zap className="mr-1 inline-block h-3 w-3"/>
                                                            Analyze with evo2
                                                        </>
                                                    )}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 cursor-pointer border-green-200 bg-green-50 px-3 text-xs text-green-700 hover:bg-green=100"
                                                    onClick={() => showComparison(variant)}
                                                >
                                                    <BarChart2 className="mr-2 inline-block h-3 w-3"/>
                                                    Compare Results
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="flex h-48 flex-col items-center justify-center text-center text-gray-400">
                    <Search className="mb-4 h-10 w-10 text-gray-300"/>
                    <p className="text-sm leading-relaxed">
                        No ClinVar SNV variants found for this gene.
                    </p>
                </div>
            )}
            </CardContent>
        </Card>
    );
}
