// RF19: store name and, for verified merchants, the "Lojista verificado" seal.
export function SellerBadge({ merchant }: { merchant: { name: string; verified: boolean } }) {
  return (
    <span className="seller">
      <strong>{merchant.name}</strong>
      {merchant.verified && (
        <>
          {" "}
          <span className="badge" title="Selo concedido pelo administrador">
            ✓ Lojista verificado
          </span>
        </>
      )}
    </span>
  );
}
