import pandas as pd
import scipy
from rdkit import Chem
from rdkit.Chem import AllChem, Draw, Descriptors
import numpy as np
from time import time
from sklearn import manifold
import umap

COLUMN_SMILES = "smiles"
COLUMN_NAMES = "names"

# This function takes as argument a dataframe and the name of the column containing the smiles.
# The function returns a datafame of valid smiles and their tsne and umap coordinates
# for 3 distances: Dice, Cosine and Tanimoto


def createChemicalSpace(smiles_df, smilesColumn, nameColumn):
    print("smiles columns: ", smilesColumn)
    print("names columns: ", nameColumn)
    print("before: ", smiles_df)
    smiles_df.rename(columns={smilesColumn: COLUMN_SMILES}, inplace=True)
    smiles_df.rename(columns={nameColumn: COLUMN_NAMES}, inplace=True)
    print("after: ", smiles_df)

    # we create a df of unique smiles. This df will be used to return the coordinates
    res_df = smiles_df.iloc[:, smilesColumn].drop_duplicates()

    print('Number of unique compounds in data:', len(res_df.values))

    # we transform the smiles into an rdkit object
    rdkitObject = [Chem.MolFromSmiles(m) for m in res_df.values]

    # we create a list of boolean telling if an object has been created
    validRdkitObject = [False if o is None else True for o in rdkitObject]

    # we display the smiles that couldn't be converted into a rdkit object
    print("Error with those smiles: ")
    print(res_df[~np.array(validRdkitObject)])

    # we get rid of the lines where the rdkitObject is None in the dataframe containing the smiles
    res_df = res_df[validRdkitObject]

    # now we create the list of valid molecules, meaning the list of rdkitObject that are not None
    mols = [o for o in rdkitObject if o is not None]

    # calculate Morgan fingerprints as bit vectors:
    fps = [AllChem.GetMorganFingerprintAsBitVect(m, 2, 1024) for m in mols]

    # now we get the list of bit vectors
    fps_bits = [(np.frombuffer(fp.ToBitString().encode(),
                 'u1') - ord('0')).tolist() for fp in fps]

    print('Number of molecules OK in data:', len(mols))
    print('Number of Fingerprints in data:', len(fps_bits))

    print('starting distance matrix')

    # return the similarities between one vector and a sequence of others
    distDice = []
    distCos = []
    distTanimoto = []

    for i in range(len(fps)):
        sims = Chem.DataStructs.BulkDiceSimilarity(fps[i], fps[:])
        distDice.append([1-x for x in sims])
        sims = Chem.DataStructs.BulkCosineSimilarity(fps[i], fps[:])
        distCos.append([1-x for x in sims])
        sims = Chem.DataStructs.BulkTanimotoSimilarity(fps[i], fps[:])
        distTanimoto.append([1-x for x in sims])

    print('Size of Dice distance matrix:', np.asarray(distDice).shape)
    print('Size of Cosine distance matrix:', np.asarray(distCos).shape)
    print('Size of Tanimoto distance matrix:', np.asarray(distTanimoto).shape)

    # T-sne step
    print('t-SNE of chemical space ...', end=' ')
    tsne = manifold.TSNE(n_components=2, init='random',
                         random_state=42, metric='precomputed')
    coorDice = tsne.fit_transform(np.asarray(distDice))
    coorCos = tsne.fit_transform(np.asarray(distCos))
    coorTanimoto = tsne.fit_transform(np.asarray(distTanimoto))

    # Umap step
    print('Umap of chemical space ...', end=' ')
    U = umap.UMAP(metric='precomputed', random_state=42)
    coorDiceUmap = U.fit_transform(np.asarray(distDice))
    coorCosUmap = U.fit_transform(np.asarray(distCos))
    coorTanimotoUmap = U.fit_transform(np.asarray(distTanimoto))

    coorDice = pd.DataFrame(coorDice)
    coorDice.columns = ['X_tsne_DiceDist', 'Y_tsne_DiceDist']
    coorCos = pd.DataFrame(coorCos)
    coorCos.columns = ['X_tsne_CosDist', 'Y_tsne_CosDist']
    coorTanimoto = pd.DataFrame(coorTanimoto)
    coorTanimoto.columns = ['X_tsne_TanimotoDist', 'Y_tsne_TanimotoDist']

    coorDiceUmap = pd.DataFrame(coorDiceUmap)
    coorDiceUmap.columns = ['X_umap_DiceDist', 'Y_umap_DiceDist']
    coorCosUmap = pd.DataFrame(coorCosUmap)
    coorCosUmap.columns = ['X_umap_CosDist', 'Y_umap_CosDist']
    coorTanimotoUmap = pd.DataFrame(coorTanimotoUmap)
    coorTanimotoUmap.columns = ['X_umap_TanimotoDist', 'Y_umap_TanimotoDist']

    coords = pd.concat([coorDice.reset_index(drop=True),
                       coorCos.reset_index(drop=True)], axis=1, sort=False)
    coords = pd.concat([coords.reset_index(
        drop=True), coorTanimoto.reset_index(drop=True)], axis=1, sort=False)

    coords = pd.concat([coords.reset_index(
        drop=True), coorDiceUmap.reset_index(drop=True)], axis=1, sort=False)
    coords = pd.concat([coords.reset_index(drop=True),
                       coorCosUmap.reset_index(drop=True)], axis=1, sort=False)
    coords = pd.concat([coords.reset_index(
        drop=True), coorTanimotoUmap.reset_index(drop=True)], axis=1, sort=False)

    # finally we concat the coordinates with the res dataframe containing the smiles

    res_df = pd.concat([res_df.reset_index(drop=True),
                       coords.reset_index(drop=True)], axis=1, sort=False)

    print('done\t')

    # now we can merge

    return pd.merge(smiles_df, res_df, on=COLUMN_SMILES, how='left')
