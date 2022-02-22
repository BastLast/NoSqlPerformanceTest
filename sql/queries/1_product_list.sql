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
    where depth <= 2 /*à remplacer par la profondeur max à explorer */
)

SELECT product.id AS productId, product.ref AS product, count(*) as nbAchats
from product
         join buy on product.id = buy.idProduct
         join user on user.id = buy.idUser
where user.id in (
    SELECT DISTINCT node as followers
    FROM tree)
GROUP by product.id
