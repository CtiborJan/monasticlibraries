<xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    xmlns:php="http://php.net/xsl"
    exclude-result-prefixes="w"
    >
    <xsl:output omit-xml-declaration="yes" indent="yes"/>
    <xsl:output method="text" encoding="UTF-8"/> 
    <xsl:template match="//w:body">
		<xsl:for-each select="w:p">
			<xsl:choose>
				<xsl:when test=".//w:r/w:rPr/w:b[not(@w:val)] or .//w:r/w:rPr/w:b[@w:val='true']"><!-- je to boldem -->
					<xsl:if test=".//w:t !=''"><!-- není to prázdný řádek -->
						<xsl:choose>
							<xsl:when test=".//w:jc/@w:val = 'center'"> <!-- vycentrované = nadpis skupiny -->
		SKUPINA:
							</xsl:when>
							<xsl:otherwise> <!-- jinak bold = hlavička rukopisu -->
			RUKOPIS:
								<xsl:if test=".//w:r/w:rPr/w:i"> <!-- kurzívou = umístění není jisté-->
									{nejisté umístění}
								</xsl:if>
							</xsl:otherwise>
						</xsl:choose>
				<xsl:apply-templates match=".//w:r"/>
				SIGNATURA:
					<xsl:value-of select="php:function('rkp_signatura',.//w:t/text())"/>  <!-- signatura je za umístěním rukopisu na řádku boldem -->
					</xsl:if>
				</xsl:when>
				<xsl:when test="./preceding-sibling::w:p[1]//w:r/w:rPr/w:b[not(@w:val)] or ./preceding-sibling::w:p[1]//w:r/w:rPr/w:b[@w:val='true']">	<!-- předchozí řádek je boldem = jsme na řádku s popisem rukopisu-->
				POPIS:
					<xsl:apply-templates match=".//w:r"/>
				</xsl:when>
				<xsl:when test="starts-with(.//w:t[1]/text(),'http')">  <!-- řádek obsahuje url adresu -->
				URL:
					<xsl:apply-templates match=".//w:r"/>
				</xsl:when>
				<xsl:when test=".//text()!=''">   <!-- ostatní řádky = záznamy -->
					ZÁZNAM:
						<xsl:if test=".//w:r/w:rPr/w:color[@w:val != '000000' and @w:val !='auto']">
							{inkunábule}
						</xsl:if>
						<xsl:apply-templates match=".//w:r"/>
						
				</xsl:when>
			</xsl:choose>
		</xsl:for-each>
    </xsl:template>
				
    <xsl:template match="w:p[not(.//w:b)]">
				<xsl:apply-templates match=".//w:r"/>
				
    </xsl:template>
	<xsl:template match="w:r">
		<xsl:choose>
			<xsl:when test = "./w:rPr/w:vertAlign[@w:val='superscript']">
				\sup:1<xsl:apply-templates match=".//w:t"/>\sup:0
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates match=".//w:t"/>
			</xsl:otherwise>
		</xsl:choose>
    </xsl:template>
    
    <xsl:template match="w:t">
		<xsl:value-of select="./text()"/>
    </xsl:template>
</xsl:stylesheet>
