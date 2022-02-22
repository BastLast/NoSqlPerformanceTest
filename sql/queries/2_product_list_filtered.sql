WITH
    recursive tree(node, depth) AS (
    SELECT link.idFollower AS node,
           1               AS depth
    FROM link
    WHERE link.idInflu = 3 /*à remplacer par l'utilisateur source */
    UNION ALL
    SELECT link.idFollower,
           depth + 1
    FROM link
             JOIN tree ON tree.node = link.idInflu
             JOIN buy ON buy.idUser = link.idInflu
    WHERE depth <= 0 /*à remplacer par la profondeur max à explorer */
      AND idProduct = 6 /* à remplacer par l'id du produit*/
)
SELECT product.id,
       product.ref,
       COUNT(*) AS achats
FROM product
         JOIN buy ON product.id = buy.idProduct
         JOIN USER ON USER.id = buy.idUser
WHERE USER.id IN (
    SELECT DISTINCT node AS followers
    FROM tree
)
  AND product.id = 6